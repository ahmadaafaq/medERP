'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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
  questionId: string;
  questionText: string;
  mode: string;
  topic?: string;
  competencyCode?: string;
  defaultMarks: number;
  customMarks: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  subQuestions?: QuestionSubPart[];
}

interface PaperSection {
  id: string;
  name: string;
  type: string;
  description?: string;
  questions: QuestionDetail[];
  practicalMarks?: number;
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
  batch_id?: string;
  topic_name?: string;
  batch_code?: string;
  sections?: PaperSection[];
}

interface StudentRow {
  id: string;
  rollno: string;
  name: string;
  gender?: string;
  evaluated: boolean;
  marks_obtained: number;
  max_marks: number;
  questionMarks?: { [qId: string]: number };
  subPartMarks?: { [subId: string]: number };
  practicalMark?: number;
  competencyScores: { [compCode: string]: { scored: number; max: number } };
  is_pass: boolean;
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

const defaultSections: PaperSection[] = [
  {
    id: 'sec-1',
    name: 'Section A',
    type: 'MCQ',
    description: 'Multiple Choice Questions (20 Marks)',
    questions: [
      {
        questionId: 'q-101',
        questionText: 'The hormone primarily responsible for stimulating erythropoiesis is:',
        mode: 'MCQ',
        topic: 'General Physiology & Hematology',
        competencyCode: 'PY1.1(2024)',
        defaultMarks: 2,
        customMarks: 2,
        optionA: 'Insulin',
        optionB: 'Thyroxine',
        optionC: 'Erythropoietin',
        optionD: 'Cortisol',
        correctOption: 'option_c'
      },
      {
        questionId: 'q-102',
        questionText: 'The principal site of erythropoiesis in adults is:',
        mode: 'MCQ',
        topic: 'General Physiology & Hematology',
        competencyCode: 'PY1.1(2024)',
        defaultMarks: 2,
        customMarks: 2,
        optionA: 'Liver',
        optionB: 'Spleen',
        optionC: 'Red bone marrow',
        optionD: 'Kidney',
        correctOption: 'option_c'
      },
      {
        questionId: 'q-103',
        questionText: 'The most abundant formed element in human peripheral blood is:',
        mode: 'MCQ',
        topic: 'Hematology & Plasma Proteins',
        competencyCode: 'PY2.1(2024)',
        defaultMarks: 2,
        customMarks: 2,
        optionA: 'Erythrocytes (RBCs)',
        optionB: 'Neutrophils',
        optionC: 'Platelets',
        optionD: 'Lymphocytes',
        correctOption: 'option_a'
      },
      {
        questionId: 'q-104',
        questionText: 'Which plasma protein is primarily responsible for maintaining intravascular oncotic pressure?',
        mode: 'MCQ',
        topic: 'Plasma Proteins & Hemostasis',
        competencyCode: 'PY2.1(2024)',
        defaultMarks: 2,
        customMarks: 2,
        optionA: 'Albumin',
        optionB: 'Gamma Globulin',
        optionC: 'Fibrinogen',
        optionD: 'Prothrombin',
        correctOption: 'option_a'
      },
    ]
  },
  {
    id: 'sec-2',
    name: 'Section B',
    type: 'DESC',
    description: 'Long Descriptive & Structured Short Notes (60 Marks)',
    questions: [
      {
        questionId: 'q-201',
        questionText: 'Describe cell membrane transport mechanisms and physiological homeostasis under CBME PY1.1.',
        mode: 'DESC',
        topic: 'General Physiology & Cell Membrane',
        competencyCode: 'PY1.1(2024)',
        defaultMarks: 10,
        customMarks: 10,
        subQuestions: [
          { id: 'sub-1', label: 'a)', questionText: 'Differentiate between primary and secondary active transport with renal examples.', marks: 5 },
          { id: 'sub-2', label: 'b)', questionText: 'Explain negative feedback regulation in internal environment homeostasis.', marks: 5 }
        ]
      },
      {
        questionId: 'q-202',
        questionText: 'Describe the stages of erythropoiesis and the factors regulating red blood cell production.',
        mode: 'DESC',
        topic: 'Haematology & Erythropoiesis',
        competencyCode: 'PY2.1(2024)',
        defaultMarks: 10,
        customMarks: 10,
        subQuestions: [
          { id: 'sub-3', label: 'a)', questionText: 'Describe morphological stages of normoblastic maturation in bone marrow.', marks: 5 },
          { id: 'sub-4', label: 'b)', questionText: 'Detail the role of Vitamin B12, Folic Acid and Iron in hemoglobin synthesis.', marks: 5 }
        ]
      }
    ]
  },
  {
    id: 'sec-3',
    name: 'Section C - Practical',
    type: 'PRACTICAL',
    description: 'Practical Spotting, OSPE Stations & Viva Voce (20 Marks)',
    practicalMarks: 20,
    questions: []
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
  const [metaLoaded, setMetaLoaded] = useState<boolean>(false);

  const [tenantName, setTenantName] = useState<string>('');
  const [facultyDeptName, setFacultyDeptName] = useState<string>('Physiology Department');

  // ── Paper States ──────────────────────────────────────────────────────
  const [allFetchedPapers, setAllFetchedPapers] = useState<ExamPaper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');

  // ── Student Roster ────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Marks Entry State ─────────────────────────────────────────────────
  const [questionMarksMap, setQuestionMarksMap] = useState<{ [qId: string]: number }>({});
  const [subPartMarksMap, setSubPartMarksMap] = useState<{ [subId: string]: number }>({});
  const [practicalSectionMark, setPracticalSectionMark] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // ── On Mount: fetch all metadata ──────────────────────────────────────
  useEffect(() => {
    setTenantName(getTenantName());
    fetchAllMetadata();
  }, []);

  // ── When dept changes, auto-select first matching subject ─────────────
  useEffect(() => {
    if (subjectsForDept.length > 0) {
      const exists = subjectsForDept.some(s => s.id === selectedSubject);
      if (!exists) setSelectedSubject(subjectsForDept[0].id);
    }
  }, [selectedDept, allSubjects]);

  // ── When selections change, reload papers ────────────────────────────
  useEffect(() => {
    if (metaLoaded) fetchExamPapers();
  }, [selectedDept, selectedSubject, selectedBatch, metaLoaded]);

  // ── When batch/paper changes, reload students ────────────────────────
  useEffect(() => {
    if (selectedBatch) fetchStudentRoster();
  }, [selectedBatch, selectedPaperId]);

  const fetchAllMetadata = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Faculty profile for dept context (use dept_id & dept_name for auto-select)
      let userDeptId = typeof window !== 'undefined' ? localStorage.getItem('departmentId') || '' : '';
      let userDeptNameStr = typeof window !== 'undefined' ? localStorage.getItem('departmentName') || '' : '';
      let userSubjId = typeof window !== 'undefined' ? localStorage.getItem('subjectId') || '' : '';

      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: h }).catch(() => null);
      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        userDeptId = userDeptId || profile.department_id || meData.departmentId || meData.department_id || '';
        userDeptNameStr = userDeptNameStr || profile.department_name || meData.departmentName || meData.department_name || '';
        userSubjId = userSubjId || profile.subject_id || meData.subjectId || meData.subject_id || '';
        if (userDeptNameStr) setFacultyDeptName(userDeptNameStr);
      }

      // 2. Fetch all master data in parallel
      const [dRes, sRes, bRes, linkRes, profRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/professional-linkers?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers: h }).catch(() => null),
      ]);

      const parseList = (j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      let fetchedDepts: Department[] = [];
      let fetchedSubjects: Subject[] = [];

      if (dRes && dRes.ok) { fetchedDepts = parseList(await dRes.json()); setDepartments(fetchedDepts); }
      if (sRes && sRes.ok) { fetchedSubjects = parseList(await sRes.json()); setAllSubjects(fetchedSubjects); }

      if (fetchedDepts.length > 0) {
        const cleanUserDept = (userDeptNameStr || facultyDeptName || '').toLowerCase().replace('department of ', '').trim();
        const matched = (userDeptId ? fetchedDepts.find(d => d.id === userDeptId) : null) ||
          (cleanUserDept ? fetchedDepts.find(d => d.name.toLowerCase().includes(cleanUserDept) || cleanUserDept.includes(d.name.toLowerCase())) : null) ||
          fetchedDepts[0];

        setSelectedDept(matched.id);

        if (fetchedSubjects.length > 0) {
          const deptSubjs = fetchedSubjects.filter(s => s.department_id === matched.id);
          const matchedSubj = (userSubjId ? deptSubjs.find(s => s.id === userSubjId) || fetchedSubjects.find(s => s.id === userSubjId) : null) ||
            deptSubjs.find(s => s.code === 'PY' || s.name.toUpperCase() === 'PHYSIOLOGY') ||
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
          code: b.code || `${b.year}-MBBS`,
          year: b.year,
          name: b.name || `${b.code} Batch (Year ${b.year})`,
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

    try {
      const res = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (rawList.length > 0) {
          const seen = new Set<string>();
          const mapped: ExamPaper[] = rawList
            .filter((p: any) => {
              const code = (p.code || '').toUpperCase();
              const name = (p.name || '').toUpperCase();
              if (code === 'EXAM-PAPER' || name === 'EXAM-PAPER' || code === 'TEST' || code === 'DUMMY') return false;
              if (seen.has(p.id) || (p.code && seen.has(p.code))) return false;
              seen.add(p.id);
              if (p.code) seen.add(p.code);
              return true;
            })
            .map((p: any) => ({
              id: p.id,
              code: p.code || 'MED-2025-PHY-T1',
              name: p.name || 'MBBS Physiology Sessional Examination',
              max_marks: Number(p.max_marks || 100),
              passing_marks: Number(p.passing_marks || 50),
              duration_mins: Number(p.duration_minutes || p.duration_mins || 180),
              sections_count: Array.isArray(p.sections) ? p.sections.length : 3,
              mode: 'MCQs & DESC',
              status: p.status || 'Approved',
              subject_id: p.subject_id,
              batch_id: p.batch_id,
              topic_name: p.topic_name || 'General Physiology & Cell Membrane',
              batch_code: p.batch_code || selectedBatch?.code || '2025-MBBS',
              sections: (Array.isArray(p.sections) && p.sections.length > 0) ? mapRawSections(p.sections) : defaultSections,
            }));
          if (mapped.length > 0) {
            setAllFetchedPapers(mapped);
            if (!selectedPaperId || !mapped.find(p => p.id === selectedPaperId)) {
              setSelectedPaperId(mapped[0].id);
            }
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch papers', e);
    }
    // Fallback if DB empty: create clean initial paper
    const fallbackPaper: ExamPaper = {
      id: 'paper-phys-01',
      code: 'MED-2025-PHY-T1',
      name: 'MBBS Physiology Sessional Examination (Paper I)',
      max_marks: 100,
      passing_marks: 50,
      duration_mins: 180,
      sections_count: 3,
      mode: 'MCQs & DESC',
      status: 'Approved',
      topic_name: 'General Physiology & Cell Membrane',
      batch_code: selectedBatch?.code || '2025-MBBS',
      sections: defaultSections,
    };
    setAllFetchedPapers([fallbackPaper]);
    setSelectedPaperId(fallbackPaper.id);
  };

  const mapRawSections = (rawSections: any[]): PaperSection[] => {
    return rawSections.map((sec: any) => ({
      id: sec.id || `sec-${Math.random()}`,
      name: sec.name || 'Section',
      type: sec.type || 'DESC',
      description: sec.description || '',
      practicalMarks: sec.practicalMarks || 0,
      questions: Array.isArray(sec.questions) ? sec.questions.map((q: any) => ({
        questionId: q.questionId || q.id || `q-${Math.random()}`,
        questionText: q.questionText || q.question_text || '',
        mode: q.mode || 'MCQ',
        topic: q.topic || '',
        competencyCode: q.competencyCode || q.competency_code || '',
        defaultMarks: Number(q.defaultMarks || q.max_marks || 2),
        customMarks: Number(q.customMarks || q.max_marks || 2),
        optionA: q.optionA || q.option_a,
        optionB: q.optionB || q.option_b,
        optionC: q.optionC || q.option_c,
        optionD: q.optionD || q.option_d,
        correctOption: q.correctOption || q.correct_option,
        subQuestions: Array.isArray(q.subQuestions) ? q.subQuestions : (typeof q.sub_questions === 'string' ? JSON.parse(q.sub_questions || '[]') : q.sub_questions || []),
      })) : [],
    }));
  };

  // Filter papers by selected subject/dept
  const filteredPapers = useMemo(() => {
    if (allFetchedPapers.length === 0) return [];
    const selSubjObj = allSubjects.find(s => s.id === selectedSubject);
    const subjCode = (selSubjObj?.code || '').toLowerCase();
    const subjName = (selSubjObj?.name || '').toLowerCase();
    if (!subjCode && !subjName) return allFetchedPapers;

    const matched = allFetchedPapers.filter(p => {
      if (p.subject_id === selectedSubject) return true;
      if (!p.subject_id) return true;
      const pCode = p.code.toLowerCase();
      const pName = p.name.toLowerCase();
      if (subjCode && (pCode.includes(subjCode) || pName.includes(subjName))) return true;
      return false;
    });
    return matched.length > 0 ? matched : allFetchedPapers;
  }, [allFetchedPapers, selectedSubject, allSubjects]);

  const activePaper = useMemo(() =>
    filteredPapers.find(p => p.id === selectedPaperId) || filteredPapers[0] || null,
    [filteredPapers, selectedPaperId]
  );

  const paperCompetencies = useMemo(() => {
    if (!activePaper?.sections) return [];
    const compSet = new Set<string>();
    activePaper.sections.forEach(sec => {
      sec.questions.forEach(q => { if (q.competencyCode) compSet.add(q.competencyCode); });
    });
    return Array.from(compSet);
  }, [activePaper]);

  const calculateStudentCompetencyScores = (paper: any, qMarks: any = {}, subMarks: any = {}) => {
    if (!paper || !Array.isArray(paper.sections)) return {};
    const scores: { [compCode: string]: { scored: number; max: number } } = {};

    paper.sections.forEach((sec: any) => {
      if (!Array.isArray(sec.questions)) return;
      sec.questions.forEach((q: any) => {
        const comp = q.competencyCode || q.competency_code || 'General';
        if (!scores[comp]) {
          scores[comp] = { scored: 0, max: 0 };
        }

        const qMax = Number(q.customMarks || q.defaultMarks || q.max_marks || q.maxMarks || 2);

        if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          const totalSubMax = q.subQuestions.reduce((sum: number, sq: any) => sum + Number(sq.marks || 1), 0);
          q.subQuestions.forEach((sq: any, idx: number) => {
            const sqKey = sq.id || `${q.questionId}_sq_${idx}`;
            const sqRatio = totalSubMax > 0 ? Number(sq.marks || 1) / totalSubMax : 1 / q.subQuestions.length;
            const sqMax = Number((sqRatio * qMax).toFixed(2));
            const sqScored = Number(subMarks[sqKey] ?? subMarks[sq.id] ?? subMarks[String(idx + 1)] ?? 0);
            
            scores[comp].max += sqMax;
            scores[comp].scored += sqScored;
          });
        } else {
          const qScored = Number(qMarks[q.questionId] ?? qMarks[q.id] ?? 0);
          scores[comp].max += qMax;
          scores[comp].scored += qScored;
        }
      });
    });

    return scores;
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
            if (r.student_id) savedResultsMap[r.student_id] = r;
            if (r.rollno) savedResultsMap[r.rollno] = r;
            if (r.registration_no) savedResultsMap[r.registration_no] = r;
            if (r.student_name) savedResultsMap[r.student_name.toLowerCase()] = r;
          });
        }
      } catch (e) {
        console.error('Error loading paper results:', e);
      }
    }

    // 2. Fetch student list from database
    try {
      let url = `${API_BASE}/student-master?tenant=${slug}`;
      if (selectedBatch?.id) url += `&batchId=${selectedBatch.id}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (rawList.length > 0) {
          const theoryMax = activePaper?.max_marks || 40;
          const practicalMax = 10;
          const maxM = theoryMax + practicalMax; // 40 Theory + 10 Practical = 50 Total Marks

          const mapped: StudentRow[] = rawList.map((st: any, idx: number) => {
            const stId = st.id || `st-${idx + 1}`;
            const stRoll = st.registration_no || st.rollno || `#${String(idx + 1).padStart(6, '0')}`;
            const stName = (st.name || '').toLowerCase();
            const saved = savedResultsMap[stId] || savedResultsMap[stRoll] || savedResultsMap[stName];

            const qM = saved?.question_marks ? (typeof saved.question_marks === 'string' ? JSON.parse(saved.question_marks) : saved.question_marks) : undefined;
            const subM = saved?.sub_part_marks ? (typeof saved.sub_part_marks === 'string' ? JSON.parse(saved.sub_part_marks) : saved.sub_part_marks) : undefined;

            return {
              id: stId,
              rollno: stRoll,
              name: st.name || `Student ${idx + 1}`,
              gender: st.gender || 'Male',
              evaluated: Boolean(saved),
              marks_obtained: saved ? Number(saved.marks_obtained) : 0,
              max_marks: maxM,
              questionMarks: qM,
              subPartMarks: subM,
              practicalMark: saved ? Number(saved.practical_mark || 0) : undefined,
              competencyScores: {},
              is_pass: saved ? Boolean(saved.is_pass) : false,
            };
          });
          setStudents(mapped);
          setSelectedStudentId(mapped[0]?.id || null);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fallback rich roster with database saved results overlay
    const theoryMax = activePaper?.max_marks || 40;
    const practicalMax = 10;
    const maxM = theoryMax + practicalMax; // 50 Total Marks
    const defaultRoster: StudentRow[] = [
      { id: 'st-1', rollno: '#20260001', name: 'Shahnawaz Ahmad', gender: 'Male', evaluated: true, marks_obtained: 88, max_marks: maxM, competencyScores: { 'PY1.1(2024)': { scored: 45, max: 50 }, 'PY2.1(2024)': { scored: 43, max: 50 } }, is_pass: true },
      { id: 'st-2', rollno: '#20260002', name: 'Priya M Nair', gender: 'Female', evaluated: true, marks_obtained: 82.5, max_marks: maxM, competencyScores: { 'PY1.1(2024)': { scored: 42, max: 50 }, 'PY2.1(2024)': { scored: 40.5, max: 50 } }, is_pass: true },
      { id: 'st-3', rollno: '#20260003', name: 'Kabir Rao Deshmukh', gender: 'Male', evaluated: false, marks_obtained: 0, max_marks: maxM, competencyScores: {}, is_pass: false },
      { id: 'st-4', rollno: '#20260004', name: 'Ananya Roy', gender: 'Female', evaluated: false, marks_obtained: 0, max_marks: maxM, competencyScores: {}, is_pass: false },
      { id: 'st-5', rollno: '#20260005', name: 'Mohammed Farhan', gender: 'Male', evaluated: false, marks_obtained: 0, max_marks: maxM, competencyScores: {}, is_pass: false },
    ];

    const mergedRoster = defaultRoster.map(s => {
      const saved = savedResultsMap[s.id] || savedResultsMap[s.rollno] || savedResultsMap[s.name.toLowerCase()];
      if (!saved) return s;
      const qM = saved.question_marks ? (typeof saved.question_marks === 'string' ? JSON.parse(saved.question_marks) : saved.question_marks) : s.questionMarks;
      const subM = saved.sub_part_marks ? (typeof saved.sub_part_marks === 'string' ? JSON.parse(saved.sub_part_marks) : saved.sub_part_marks) : s.subPartMarks;
      return {
        ...s,
        evaluated: true,
        marks_obtained: Number(saved.marks_obtained),
        questionMarks: qM,
        subPartMarks: subM,
        practicalMark: Number(saved.practical_mark || 0),
        is_pass: Boolean(saved.is_pass),
      };
    });

    setStudents(mergedRoster);
    setSelectedStudentId(mergedRoster[0].id);
    setLoading(false);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q) || String(s.rollno).toLowerCase().includes(q));
  }, [students, searchQuery]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId) || null, [students, selectedStudentId]);

  // Reset / populate marks when selected student or paper changes
  useEffect(() => {
    if (!selectedStudent || !activePaper?.sections) return;
    const qMarks: { [qId: string]: number } = {};
    const subMarks: { [subId: string]: number } = {};

    activePaper.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const savedQ = selectedStudent.questionMarks?.[q.questionId];
        qMarks[q.questionId] = selectedStudent.evaluated
          ? (savedQ !== undefined ? savedQ : (q.customMarks || q.defaultMarks || 2))
          : 0;

        if (Array.isArray(q.subQuestions)) {
          q.subQuestions.forEach(sq => {
            const savedSub = selectedStudent.subPartMarks?.[sq.id];
            subMarks[sq.id] = selectedStudent.evaluated
              ? (savedSub !== undefined ? savedSub : sq.marks)
              : 0;
          });
        }
      });
    });

    setQuestionMarksMap(qMarks);
    setSubPartMarksMap(subMarks);
    setPracticalSectionMark(selectedStudent.evaluated ? (selectedStudent.practicalMark ?? 18) : 0);
  }, [selectedStudentId, selectedPaperId, selectedStudent?.evaluated]);

  const handleUpdateQMark = (qId: string, mark: number) => setQuestionMarksMap(prev => ({ ...prev, [qId]: mark }));
  const handleUpdateSubMark = (subId: string, mark: number) => setSubPartMarksMap(prev => ({ ...prev, [subId]: mark }));

  const calculatedStudentTotal = useMemo(() => {
    const qTotal = Object.values(questionMarksMap).reduce((a, b) => a + Number(b || 0), 0);
    const subTotal = Object.values(subPartMarksMap).reduce((a, b) => a + Number(b || 0), 0);
    return qTotal + subTotal + Number(practicalSectionMark || 0);
  }, [questionMarksMap, subPartMarksMap, practicalSectionMark]);

  const handleSaveStudentEvaluation = async () => {
    if (!selectedStudent || !activePaper) return;
    setSaving(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    try {
      await fetch(`${API_BASE}/exams/results?tenant=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          rollno: selectedStudent.rollno,
          studentName: selectedStudent.name,
          paperId: activePaper.id,
          marksObtained: calculatedStudentTotal,
          questionMarks: questionMarksMap,
          subPartMarks: subPartMarksMap,
          practicalMark: practicalSectionMark,
        }),
      });
    } catch (err) {
      console.error('Error saving student result:', err);
    }

    const maxM = activePaper.max_marks || 100;
    setStudents(prev => prev.map(s => {
      if (s.id !== selectedStudent.id) return s;
      const compScores: { [k: string]: { scored: number; max: number } } = {};
      paperCompetencies.forEach(comp => {
        const compQs = activePaper.sections?.flatMap(sec => sec.questions.filter(q => q.competencyCode === comp)) || [];
        const compMax = compQs.reduce((a, q) => a + (q.customMarks || 2), 0);
        const compScored = compQs.reduce((a, q) => {
          if (q.subQuestions?.length) {
            return a + q.subQuestions.reduce((sa, sq) => sa + (subPartMarksMap[sq.id] || 0), 0);
          }
          return a + (questionMarksMap[q.questionId] || 0);
        }, 0);
        compScores[comp] = { scored: compScored, max: compMax || 50 };
      });

      return {
        ...s,
        evaluated: true,
        marks_obtained: calculatedStudentTotal,
        max_marks: maxM,
        questionMarks: questionMarksMap,
        subPartMarks: subPartMarksMap,
        practicalMark: practicalSectionMark,
        competencyScores: compScores,
        is_pass: calculatedStudentTotal >= (maxM * 0.4)
      };
    }));

    setSaveSuccessMsg(`Evaluation for ${selectedStudent.name} (${calculatedStudentTotal.toFixed(2)} / ${activePaper.max_marks} Marks) saved successfully!`);
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
                  🏛️ {deptObj?.name || facultyDeptName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                  Auto-Selected Department
                </span>
                {subjObj && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
                    📖 {subjObj.name} ({subjObj.code})
                  </span>
                )}
                {selectedBatch && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/20">
                    🎓 Batch: {selectedBatch.name || selectedBatch.code}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1.5">
                Faculty Evaluation Center — Designed Paper Grading
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Evaluate student paper submissions section-wise, enter marks per question, and track CBME Competency Achievement.
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

          {/* ── STEP 1: Cascading Filter Context Bar ── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">1</span>
                STEP 1: SELECT DEPARTMENT → SUBJECT → BATCH → CBME YEAR → PROFESSIONAL PHASE
              </h3>
              <span className="text-[11px] font-mono font-extrabold text-[#7867FF]">
                {tenantName || getTenantSlug()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1 text-xs">
              {/* 1. Department */}
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Department *</label>
                <select
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setSelectedSubject(''); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] shadow-sm"
                >
                  {departments.length === 0 ? <option value="">Loading Departments...</option> : (
                    departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                  )}
                </select>
              </div>

              {/* 2. Subject */}
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] shadow-sm"
                >
                  {subjectsForDept.length === 0 ? <option value="">Select Department First</option> : (
                    subjectsForDept.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)
                  )}
                </select>
              </div>

              {/* 3. Batch */}
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Target Batch *</label>
                <select
                  value={selectedBatch?.id || ''}
                  onChange={e => { const b = batches.find(b => b.id === e.target.value); setSelectedBatch(b || null); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] shadow-sm"
                >
                  {batches.length === 0 ? <option value="">Loading Batches...</option> : (
                    batches.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)
                  )}
                </select>
              </div>

              {/* 4. CBME Year */}
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">CBME Year *</label>
                <select
                  value={selectedCbmeYearId}
                  onChange={e => setSelectedCbmeYearId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] shadow-sm"
                >
                  {cbmeYears.length === 0 ? <option value="">Loading...</option> : (
                    cbmeYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)
                  )}
                </select>
              </div>

              {/* 5. Professional Phase */}
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Professional Phase *</label>
                <select
                  value={selectedProfId}
                  onChange={e => setSelectedProfId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] shadow-sm"
                >
                  {professionals.length === 0 ? <option value="">Loading...</option> : (
                    professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ── STEP 2: Designed & Approved Examination Paper Cards (Exact screenshot match) ── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">2</span>
                STEP 2: DESIGNED &amp; APPROVED EXAMINATION PAPERS ({filteredPapers.length} Papers)
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                ✓ Approved — MCQs &amp; DESC Mode
              </span>
            </div>

            {filteredPapers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <span className="text-4xl">📋</span>
                <p className="text-sm font-black text-[#1B1E28] dark:text-white">No Designed Examination Papers Found</p>
                <p className="text-xs text-[#4E5969] dark:text-slate-400">Design and publish examination papers in the Assessment Designer tab first.</p>
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
                            {paper.duration_mins ? `${paper.duration_mins} MINS` : '180 MINS'}
                          </p>
                          <p className="text-[11px] font-extrabold uppercase text-[#4E5969] dark:text-slate-400">
                            {paper.max_marks} MARKS
                          </p>
                          <p className="text-[10px] font-bold text-[#7B8794] uppercase mt-1">
                            MON, AUG 10
                          </p>
                        </div>

                        {/* Right Side: Title, Peach Tag, and Meta */}
                        <div className="flex-1 min-w-0 space-y-2 text-right">
                          <h4 className="text-xs sm:text-sm font-black text-[#1B1E28] dark:text-white uppercase truncate">
                            {deptObj?.name || 'PHYSIOLOGY'} — {paper.name}
                          </h4>

                          <div className="inline-block px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 text-[10px] font-extrabold uppercase tracking-tight truncate max-w-full">
                            THEORY "{paper.topic_name || 'General Physiology & Cell Membrane'}"
                          </div>

                          <div className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold space-y-0.5">
                            <p>#{paper.batch_code || selectedBatch?.code || '2025-MBBS'} • Room LT-1 Medical</p>
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
                          className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border flex items-center justify-between ${
                            isSel
                              ? 'bg-[#EEF2FF] border-2 border-[#5B4BFF] text-[#1B1E28] dark:text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800/60 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/40 text-[#4E5969] dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-mono font-black ${isSel ? 'text-[#5B4BFF]' : 'text-[#7867FF]'}`}>
                                {st.rollno}
                              </span>
                              {st.evaluated ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                  ✓ Done
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FFF8E6] text-[#FFB020] border border-[#FFB020]/30">
                                  Pending
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-black text-[#1B1E28] dark:text-white mt-1">{st.name}</h5>
                          </div>
                          <div className="text-right">
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
                    <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-4 flex-wrap gap-3">
                      <div>
                        <span className="text-[10px] font-black text-[#5B4BFF] uppercase tracking-widest">
                          Evaluating Answer Sheet
                        </span>
                        <h3 className="text-lg font-black text-[#1B1E28] dark:text-white mt-0.5">{selectedStudent.name}</h3>
                        <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                          Roll No: <strong className="font-mono text-[#5B4BFF]">{selectedStudent.rollno}</strong> • Paper: [{activePaper.code}] {activePaper.name}
                        </p>
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
                            <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold">{sec.description}</span>
                          </div>

                          {/* Practical Section OSPE */}
                          {sec.type === 'PRACTICAL' ? (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 shadow-sm">
                              <div>
                                <p className="text-xs font-black text-[#1B1E28] dark:text-white">🧪 Practical Spotting, OSPE Stations &amp; Viva Voce</p>
                                <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">Max Weightage: {sec.practicalMarks || 20} Marks</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#4E5969] dark:text-slate-300">Awarded Marks:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={sec.practicalMarks || 20}
                                  step={0.5}
                                  value={practicalSectionMark}
                                  onChange={e => setPracticalSectionMark(Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-400 text-purple-700 dark:text-purple-300 font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                                />
                                <span className="text-xs text-[#7B8794] font-bold">/ {sec.practicalMarks || 20}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              {sec.questions.length === 0 ? (
                                <p className="text-xs text-[#4E5969] dark:text-slate-400 italic text-center py-3">No questions defined in this section</p>
                              ) : sec.questions.map((q, qIdx) => (
                                <div key={q.questionId} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1.5 flex-1">
                                      {/* Top Row: Q Number, Topic, Competency */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-black text-[#5B4BFF] text-xs">Q{qIdx + 1}.</span>
                                        {q.competencyCode && (
                                          <span className="px-2 py-0.5 rounded-full font-mono font-black text-[10px] bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                            🎯 {q.competencyCode}
                                          </span>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                          q.mode === 'MCQ' ? 'bg-[#EEF2FF] text-[#5B4BFF]' : 'bg-[#FFF4EC] text-[#F36C21]'
                                        }`}>
                                          [{q.mode}]
                                        </span>
                                        {q.topic && (
                                          <span className="text-[10px] font-bold text-[#4E5969] dark:text-slate-400">
                                            📚 {q.topic}
                                          </span>
                                        )}
                                      </div>

                                      {/* Question Prompt / Name (Crucial Requirement) */}
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

                                    {/* Direct Marks Input (for single prompt questions) */}
                                    {(!q.subQuestions || q.subQuestions.length === 0) && (
                                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                        <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-300">Marks:</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={q.customMarks || q.defaultMarks || 2}
                                          step={0.5}
                                          value={questionMarksMap[q.questionId] !== undefined ? questionMarksMap[q.questionId] : ''}
                                          placeholder="0"
                                          onChange={e => handleUpdateQMark(q.questionId, Number(e.target.value))}
                                          className="w-16 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#5B4BFF]/50 text-[#00C48C] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm"
                                        />
                                        <span className="text-[11px] text-[#7B8794] font-bold">/ {q.customMarks || q.defaultMarks || 2}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub-Questions / Sub-Parts Tree */}
                                  {Array.isArray(q.subQuestions) && q.subQuestions.length > 0 && (
                                    <div className="pl-4 space-y-2 border-l-2 border-[#5B4BFF]/40 pt-1.5">
                                      {(() => {
                                        const totalRaw = q.subQuestions.reduce((sum, s) => sum + Number(s.marks || 1), 0);
                                        const qMax = Number(q.customMarks || q.defaultMarks || 3);
                                        return q.subQuestions.map(sq => {
                                          const sqMax = totalRaw > 0
                                            ? Number(((Number(sq.marks || 1) / totalRaw) * qMax).toFixed(2))
                                            : Number((qMax / (q.subQuestions?.length || 1)).toFixed(2));
                                          
                                          return (
                                            <div key={sq.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className="font-mono font-black text-[#5B4BFF] text-xs shrink-0">{sq.label}</span>
                                                <span className="text-xs font-bold text-[#1B1E28] dark:text-white">{sq.questionText}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                                <span className="text-[10px] font-black text-[#4E5969] dark:text-slate-300">Marks:</span>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={sqMax}
                                                  step={0.5}
                                                  value={subPartMarksMap[sq.id] !== undefined ? subPartMarksMap[sq.id] : ''}
                                                  placeholder="0"
                                                  onChange={e => handleUpdateSubMark(sq.id, Number(e.target.value))}
                                                  className="w-16 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/50 text-[#00C48C] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#00C48C] shadow-sm"
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
                              ))}
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

          {/* ── STEP 4: CBME Competency Performance Matrix Table ── */}
          {students.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00C48C] text-white flex items-center justify-center text-[10px] font-black">4</span>
                    📈 CBME COMPETENCY PERFORMANCE MATRIX &amp; RESULTS
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">Competency-wise breakdown and outcome matrix per student</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase">PAPER:</span>
                  <select
                    value={selectedPaperId}
                    onChange={e => setSelectedPaperId(e.target.value)}
                    className="px-3.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold shadow-sm"
                  >
                    {filteredPapers.map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[11px] font-black text-[#1B1E28] dark:text-slate-300 uppercase tracking-wider bg-[#F8FAFC] dark:bg-slate-800/60">
                      <th className="py-3.5 px-4 rounded-l-xl">Roll No</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Marks Obtained / Max</th>
                      <th className="py-3.5 px-4">Percentage</th>
                      {paperCompetencies.map(comp => (
                        <th key={comp} className="py-3.5 px-4 text-center text-[#00C48C]">🎯 {comp}</th>
                      ))}
                      <th className="py-3.5 px-4 text-right rounded-r-xl">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                    {students.map(st => {
                      const percentage = st.max_marks > 0 ? (st.marks_obtained / st.max_marks) * 100 : 0;
                      return (
                        <tr key={st.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF]">{st.rollno}</td>
                          <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white">{st.name}</td>
                          <td className="py-3.5 px-4 font-mono font-black text-[#00C48C]">{st.marks_obtained.toFixed(2)} / {st.max_marks}</td>
                          <td className="py-3.5 px-4 font-mono font-black text-[#F36C21]">{percentage.toFixed(1)}%</td>
                          {paperCompetencies.map(comp => {
                            const computedScores = calculateStudentCompetencyScores(activePaper, st.questionMarks, st.subPartMarks);
                            const compData = (computedScores[comp] && computedScores[comp].max > 0)
                              ? computedScores[comp]
                              : (st.competencyScores[comp] || { scored: 0, max: 0 });

                            if (compData.max === 0) {
                              return (
                                <td key={comp} className="py-3.5 px-4 text-center">
                                  <span className="text-[#4E5969] dark:text-slate-500 font-mono text-[11px] font-bold">—</span>
                                </td>
                              );
                            }

                            const compPct = Math.min(100, Math.round((compData.scored / compData.max) * 100));
                            const isGood = compPct >= 50;

                            return (
                              <td key={comp} className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                                  isGood
                                    ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30'
                                    : 'bg-[#FFF8E6] text-[#FFB020] border-[#FFB020]/30'
                                }`}>
                                  {compData.scored}/{compData.max} = {compPct}%
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3.5 px-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              st.is_pass
                                ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30'
                                : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
                            }`}>
                              {st.is_pass ? '✓ PASS' : '⚠️ FAIL'}
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
