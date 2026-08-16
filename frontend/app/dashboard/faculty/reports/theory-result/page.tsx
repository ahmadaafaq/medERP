'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import FacultyReportsNav from '../../../../../components/FacultyReportsNav';

// ─── Interfaces conforming strictly to RestrictAPI.md (Zero GUID Standard) ──
interface College {
  id?: string;
  colg_cd?: number | string;
  code: string;
  name: string;
  slug: string;
}

interface CourseItem {
  id?: string;
  course_cd: string;
  code: string;
  name: string;
  degree_level?: string;
  colg_cd?: string;
}

interface BranchItem {
  id?: string;
  branch_cd: string;
  code: string;
  name: string;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
}

interface BatchItem {
  id?: string;
  batch_cd: string;
  code: string;
  name?: string;
  year?: number;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
}

interface Department {
  id?: string;
  dept_cd?: number | string;
  name: string;
  code: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  colg_cd?: string;
  college_slug?: string;
}

interface Subject {
  id?: string;
  subject_cd?: number | string;
  name: string;
  code: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  course_cd?: string;
  branch_cd?: string;
  semester?: number | string;
  colg_cd?: string;
  college_slug?: string;
}

interface QuestionSubPart {
  id: string;
  label: string;
  questionText?: string;
  question_text?: string;
  marks: number;
}

interface PaperQuestion {
  id: string;
  qNo: number;
  part: 'PART A' | 'PART B' | 'PART C';
  questionText: string;
  mode: 'MCQ' | 'DESC' | 'PRACTICAL';
  topic?: string;
  subTopicCode: string;
  subTopicDesc?: string;
  maxMarks: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  subQuestions?: QuestionSubPart[];
}

interface SubTopicSummary {
  code: string;
  desc: string;
  totalMaxMarks: number;
  questionCount: number;
}

interface PracticalCategory {
  id: string;
  name: string;
  icon: string;
  maxMarks: number;
  scoredMarks: number;
  percentage: number;
  color: string;
}

interface StudentTheoryReport {
  id: string;
  rollno: string;
  registration_no?: string;
  name: string;
  gender: string;
  course: string;
  batch: string;
  semester: string;
  evaluated: boolean;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  practicalMarks: number;
  practicalMax: number;
  practicalPercentage: number;
  practicalCategories: PracticalCategory[];
  isPass: boolean;
  photo_url?: string;
  questionMarks?: { [qId: string]: number };
  subPartMarks?: { [subKey: string]: number };
  subTopicResults: {
    [subTopicCode: string]: {
      scored: number;
      totalMax: number;
      pct: number;
      questionCount: number;
      desc?: string;
    };
  };
  questionAttempts: {
    questionId: string;
    qNo: number;
    part: string;
    questionText: string;
    subTopicCode: string;
    subTopicDesc?: string;
    selectedOption?: string;
    correctOption?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    marksScored: number;
    maxMarks: number;
    isCorrect: boolean;
    statusTag: 'correct' | 'wrong' | 'partial';
    subQuestions?: { id: string; label: string; questionText: string; scored: number; max: number }[];
  }[];
}

interface ExamPaper {
  id: string;
  code: string;
  name: string;
  max_marks: number;
  passing_marks: number;
  duration_mins?: number;
  status?: string;
  subject_code?: string;
  batch_code?: string;
  sections?: any[];
  questions: PaperQuestion[];
}

const API_BASE = 'http://localhost:3001/api/v1';

const getInitialColgCd = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('colg_cd') || '1';
  }
  return '1';
};

const getInitialTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('institutionSlug') ||
      localStorage.getItem('tenant') ||
      'srms-cet-bareilly'
    );
  }
  return 'srms-cet-bareilly';
};

const CHART_COLORS = [
  '#4F46E5', '#EA580C', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#2563EB', '#10B981', '#DB2777', '#9333EA',
  '#0D9488', '#F59E0B', '#6366F1', '#84CC16', '#0891B2',
];

export default function TheoryResultReportPage() {
  const pathname = usePathname();
  const currentRole: 'admin' | 'faculty' = (pathname && pathname.includes('/dashboard/admin/')) ? 'admin' : 'faculty';

  // ─── 1. Colleges State (Rule 1: colg_cd) ───────────────────────────────────
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColgCd, setSelectedColgCd] = useState<string>(getInitialColgCd);
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>(getInitialTenantSlug);

  // ─── Step 1: 7-Level Cascading Hierarchy (RestrictAPI.md Standard) ─────────
  // Order: 1. College -> 2. Course -> 3. Branch -> 4. Batch -> 5. Semester -> 6. Department -> 7. Subject
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('13'); // default BCA

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchCd, setSelectedBranchCd] = useState<string>('1');

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchCd, setSelectedBatchCd] = useState<string>('B2026-C13-1');

  const [selectedSemCd, setSelectedSemCd] = useState<string>('1'); // Sem 1 to 8

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptCd, setSelectedDeptCd] = useState<string>('13'); // BCA Dept

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectCd, setSelectedSubjectCd] = useState<string>('88534'); // Web Technology

  // ─── Step 2: Exam Papers ───────────────────────────────────────────────────
  const [allFetchedPapers, setAllFetchedPapers] = useState<ExamPaper[]>([]);
  const [selectedPaperCode, setSelectedPaperCode] = useState<string>('');

  // ─── Step 3: Evaluated Students Data ───────────────────────────────────────
  const [students, setStudents] = useState<StudentTheoryReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ─── Analysis Modal State (4 Tabs: SubTopics | Tracking | Practical | Chart) ──
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeStudent, setActiveStudent] = useState<StudentTheoryReport | null>(null);
  const [modalTab, setModalTab] = useState<'subtopics' | 'tracking' | 'practical' | 'chart'>('subtopics');
  const [expandedSubTopics, setExpandedSubTopics] = useState<{ [code: string]: boolean }>({});
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Utility for foolproof array deduplication by key
  const dedupeBy = <T,>(arr: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return (arr || []).filter(item => {
      if (!item) return false;
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ─── 1. Fetch Colleges on Mount ────────────────────────────────────────────
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
        const rawList: College[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        const list = dedupeBy(rawList, (c: College) => String(c.colg_cd || c.code || c.slug || c.id));
        setColleges(list);

        const currentSlug = getInitialTenantSlug();
        const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;
        const found = list.find((c: College) => 
          (savedColgCd && String(c.colg_cd || c.code) === savedColgCd) ||
          c.slug === currentSlug || String(c.code) === currentSlug || String(c.colg_cd) === currentSlug
        );
        if (found) {
          setSelectedCollegeSlug(found.slug);
          setSelectedColgCd(String(found.colg_cd || found.code || '1'));
        } else if (list.length > 0) {
          setSelectedCollegeSlug(list[0].slug);
          setSelectedColgCd(String(list[0].colg_cd || list[0].code || '1'));
        }
      }
    } catch (e) {
      console.error('Failed to fetch colleges', e);
    }
  };

  // ─── 2. Fetch Master Hierarchy Data (Strict Schema-per-Tenant) ─────────────
  const fetchMetadata = async (slug: string) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {
        'x-tenant-slug': slug,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };
      const parse = (j: any) => Array.isArray(j?.data?.data) ? j.data.data : Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      const [cRes, brRes, bRes, dRes, sRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/branches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers }).catch(() => null),
      ]);

      // 1. Courses
      if (cRes && cRes.ok) {
        const cList: CourseItem[] = parse(await cRes.json());
        setCourses(cList);
      } else {
        setCourses([
          { code: 'BCA', course_cd: '13', name: 'Bachelor of Computer Applications' },
          { code: 'B.TECH', course_cd: '1', name: 'Bachelor of Technology' },
          { code: 'B.PHARM', course_cd: '2', name: 'Bachelor of Pharmacy' },
          { code: 'MCA', course_cd: '3', name: 'Master of Computer Applications' },
          { code: 'MBA', course_cd: '4', name: 'Master of Business Administration' },
          { code: 'M.TECH', course_cd: '5', name: 'Master of Technology' },
          { code: 'M. PHARM', course_cd: '6', name: 'Master of Pharmacy' },
          { code: 'BBA', course_cd: '12', name: 'Bachelor of Business Administration' },
        ]);
      }

      // 2. Branches
      if (brRes && brRes.ok) {
        const brList: BranchItem[] = parse(await brRes.json());
        setBranches(brList);
      }

      // 3. Batches
      if (bRes && bRes.ok) {
        const bList: BatchItem[] = parse(await bRes.json());
        setBatches(bList);
      }

      // 4. Departments
      if (dRes && dRes.ok) {
        const dList: Department[] = parse(await dRes.json());
        setDepartments(dList);
      }

      // 5. Subjects
      if (sRes && sRes.ok) {
        const sList: Subject[] = parse(await sRes.json());
        setAllSubjects(sList);
      }

      // 6. Exam Papers
      if (pRes && pRes.ok) {
        const pList = parse(await pRes.json());
        const mappedPapers: ExamPaper[] = pList.map((p: any) => {
          const questions = extractQuestionsFromSections(p.sections || []);
          return {
            id: p.id,
            code: p.code || 'EXAM-PAPER',
            name: p.name || 'Examination Paper',
            max_marks: Number(p.max_marks || 100),
            passing_marks: Number(p.passing_marks || 40),
            duration_mins: Number(p.duration_minutes || p.duration_mins || 60),
            status: p.status || 'Active',
            subject_code: p.subject_code || p.subject_cd,
            batch_code: p.batch_code || p.batch_cd,
            sections: Array.isArray(p.sections) ? p.sections : [],
            questions,
          };
        });
        setAllFetchedPapers(mappedPapers);
        if (mappedPapers.length > 0) {
          setSelectedPaperCode(mappedPapers[0].code);
        }
      }
    } catch (e) {
      console.error('fetchMetadata error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchMetadata(selectedCollegeSlug);
    }
  }, [selectedCollegeSlug]);

  // ─── Extract Questions Helper from Sections ────────────────────────────────
  const extractQuestionsFromSections = (sections: any[]): PaperQuestion[] => {
    const list: PaperQuestion[] = [];
    let qCount = 1;
    sections.forEach((sec: any) => {
      if (sec.type === 'PRACTICAL') return;
      const qArr = sec.selectedQuestions || sec.pickedQuestions || sec.questions || [];
      qArr.forEach((q: any) => {
        const subQs = q.sub_questions || q.subQuestions || [];
        const compCode = q.sub_topic_code || q.competency_code || q.competencyCode || q.unit_code || 'CO1';
        list.push({
          id: q.id || q.questionId || `q-${qCount}`,
          qNo: qCount++,
          part: sec.type === 'MCQ' || (sec.name || '').includes('A') ? 'PART A' : 'PART B',
          questionText: q.questionText || q.question_text || 'Examination Question',
          mode: q.mode || (sec.type === 'DESC' ? 'DESC' : 'MCQ'),
          topic: q.topic || 'Subject Topic',
          subTopicCode: compCode,
          subTopicDesc: q.sub_topic_name || q.competency_desc || q.competencyDesc || `SubTopic ${compCode}`,
          maxMarks: Number(q.marks || q.customMarks || q.defaultMarks || (q.mode === 'MCQ' ? 2 : 10)),
          optionA: q.option_a || q.optionA,
          optionB: q.option_b || q.optionB,
          optionC: q.option_c || q.optionC,
          optionD: q.option_d || q.optionD,
          correctOption: q.correct_option || q.correctOption || 'option_a',
          subQuestions: Array.isArray(subQs) ? subQs : [],
        });
      });
    });
    return list;
  };

  // ─── Filter Courses by Selected College (Rule 1 & Medical Exclusion for CET) ─
  const isMedicalCollege = selectedColgCd === '2' || selectedCollegeSlug.includes('ims');

  const filteredCourses = useMemo(() => {
    const list = courses.filter(c => {
      const cName = (c.name || '').toLowerCase();
      const cCode = (c.code || '').toLowerCase();
      const isMedCourse = cName.includes('mbbs') || cCode === 'mbbs' || cName.includes('medicine');
      if (isMedicalCollege) {
        return isMedCourse || c.colg_cd === '2';
      } else {
        return !isMedCourse;
      }
    });
    return dedupeBy(list, c => String(c.course_cd || c.code || c.id));
  }, [courses, isMedicalCollege]);

  useEffect(() => {
    if (filteredCourses.length > 0) {
      const exists = filteredCourses.some(c => String(c.course_cd) === selectedCourseCd || c.code === selectedCourseCd);
      if (!exists) {
        setSelectedCourseCd(String(filteredCourses[0].course_cd || filteredCourses[0].code));
      }
    }
  }, [filteredCourses, selectedCourseCd]);

  // ─── Filter Branches by Selected Course ────────────────────────────────────
  const filteredBranches = useMemo(() => {
    const list = branches.filter(b => {
      if (isMedicalCollege) {
        return (b.name && b.name.includes('Department of')) || b.code === 'ANA' || b.code === 'PHY';
      }
      const isMed = b.code === 'ANA' || b.code === 'PHY' || (b.name && (b.name.toLowerCase().includes('anatomy') || b.name.toLowerCase().includes('physiology')));
      if (isMed) return false;

      if (!selectedCourseCd) return true;
      return String(b.course_cd) === String(selectedCourseCd) || (b.course_name && b.course_name.toLowerCase().includes(selectedCourseCd.toLowerCase()));
    });

    const base = list.length > 0 ? list : [{ branch_cd: '1', code: '1', name: 'General Branch (1)' }];
    return dedupeBy(base, b => String(b.branch_cd || b.code || b.id));
  }, [branches, selectedCourseCd, isMedicalCollege]);

  useEffect(() => {
    if (filteredBranches.length > 0) {
      const exists = filteredBranches.some(b => b.branch_cd === selectedBranchCd || b.code === selectedBranchCd);
      if (!exists) {
        setSelectedBranchCd(filteredBranches[0].branch_cd || filteredBranches[0].code);
      }
    }
  }, [filteredBranches, selectedBranchCd]);

  // ─── Filter Batches by Selected Course & Branch ────────────────────────────
  const filteredBatches = useMemo(() => {
    const list = batches.filter(b => {
      if (!selectedCourseCd) return true;
      return String(b.course_cd) === String(selectedCourseCd) || (b.code && b.code.includes(`C${selectedCourseCd}`));
    });
    return dedupeBy(list, b => String(b.code || b.batch_cd || b.id));
  }, [batches, selectedCourseCd]);

  useEffect(() => {
    if (filteredBatches.length > 0) {
      const exists = filteredBatches.some(b => b.code === selectedBatchCd || b.batch_cd === selectedBatchCd);
      if (!exists) {
        setSelectedBatchCd(filteredBatches[0].code || filteredBatches[0].batch_cd);
      }
    }
  }, [filteredBatches, selectedBatchCd]);

  // ─── Filter Departments (Strictly CET Engineering vs IMS Medical) ──────────
  const filteredDepartments = useMemo(() => {
    const list = departments.filter(d => {
      const dName = (d.name || '').toLowerCase();
      const isMed = dName.includes('anatomy') || dName.includes('physiology') || d.code === 'ANA' || d.code === 'PHY';
      if (isMedicalCollege) {
        return isMed;
      }
      if (isMed) return false;

      if (!selectedCourseCd) return true;
      return String(d.course_cd) === String(selectedCourseCd) || dName.includes(selectedCourseCd.toLowerCase());
    });
    return dedupeBy(list, d => String(d.dept_cd || d.code || d.name || d.id));
  }, [departments, selectedCourseCd, isMedicalCollege]);

  useEffect(() => {
    if (filteredDepartments.length > 0) {
      const exists = filteredDepartments.some(d => d.name === selectedDeptCd || d.code === selectedDeptCd || String(d.dept_cd) === selectedDeptCd);
      if (!exists) {
        setSelectedDeptCd(filteredDepartments[0].name || filteredDepartments[0].code || String(filteredDepartments[0].dept_cd || ''));
      }
    }
  }, [filteredDepartments, selectedDeptCd]);

  // ─── Filter Subjects by Course, Department & Semester ──────────────────────
  const filteredSubjects = useMemo(() => {
    const matched = allSubjects.filter(s => {
      const sName = (s.name || '').toLowerCase();
      const sCode = (s.code || '').toLowerCase();
      const isMed = sCode.startsWith('ana') || sCode.startsWith('phy') || sName.includes('anatomy') || sName.includes('physiology');
      if (!isMedicalCollege && isMed) return false;

      if (selectedCourseCd && s.course_cd && String(s.course_cd) !== String(selectedCourseCd)) {
        return false;
      }
      return true;
    });

    const base = matched.length > 0 ? matched : allSubjects;
    return dedupeBy(base, s => String(s.subject_cd || s.code || s.name || s.id));
  }, [allSubjects, selectedCourseCd, isMedicalCollege]);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const exists = filteredSubjects.some(s => s.code === selectedSubjectCd || String(s.subject_cd) === selectedSubjectCd);
      if (!exists) {
        setSelectedSubjectCd(filteredSubjects[0].code || String(filteredSubjects[0].subject_cd || ''));
      }
    }
  }, [filteredSubjects, selectedSubjectCd]);

  // ─── Filtered Exam Papers for Subject ──────────────────────────────────────
  const filteredPapers = useMemo(() => {
    if (allFetchedPapers.length === 0) return [];
    if (!selectedSubjectCd) return allFetchedPapers;

    const selSubjObj = allSubjects.find(s => s.code === selectedSubjectCd || String(s.subject_cd) === selectedSubjectCd);
    const subjCode = selSubjObj?.code?.toLowerCase() || selectedSubjectCd.toLowerCase();
    const subjName = selSubjObj?.name?.toLowerCase() || '';

    const matched = allFetchedPapers.filter(p => {
      if (p.subject_code && p.subject_code.toLowerCase() === subjCode) return true;
      const pCode = (p.code || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      if (subjCode && (pCode.includes(subjCode) || pName.includes(subjName))) return true;
      return false;
    });

    return matched.length > 0 ? matched : allFetchedPapers;
  }, [allFetchedPapers, selectedSubjectCd, allSubjects]);

  const activePaper = useMemo(() => {
    return filteredPapers.find(p => p.code === selectedPaperCode) || filteredPapers[0] || allFetchedPapers[0] || null;
  }, [filteredPapers, allFetchedPapers, selectedPaperCode]);

  // ─── Dynamic SubTopics List from Active Paper ──────────────────────────────
  const activePaperSubTopics = useMemo<SubTopicSummary[]>(() => {
    if (!activePaper) return [];
    const map = new Map<string, SubTopicSummary>();

    (activePaper.questions || []).forEach((q) => {
      const code = q.subTopicCode || 'CO1';
      const desc = q.subTopicDesc || q.topic || `SubTopic ${code}`;
      const subQs = q.subQuestions || [];
      let qMax = Number(q.maxMarks || 2);
      if (subQs.length > 0) {
        qMax = subQs.reduce((sum, sq) => sum + Number(sq.marks || 2.5), 0);
      }

      const existing = map.get(code);
      if (existing) {
        existing.totalMaxMarks += qMax;
        existing.questionCount += 1;
      } else {
        map.set(code, {
          code,
          desc,
          totalMaxMarks: qMax,
          questionCount: 1,
        });
      }
    });

    if (map.size === 0) {
      return [
        { code: 'CO1', desc: 'Web Technologies & Architecture', totalMaxMarks: 10, questionCount: 5 },
        { code: 'PYTH1.1', desc: 'Python Data Structures & Methods', totalMaxMarks: 35, questionCount: 5 },
      ];
    }

    return Array.from(map.values());
  }, [activePaper]);

  // ─── Fetch Evaluated Student Reports directly from PostgreSQL ──────────────
  const fetchEvaluatedStudentReports = async () => {
    setLoading(true);
    const slug = selectedCollegeSlug;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'x-tenant-slug': slug,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    const parse = (j: any) => Array.isArray(j?.data?.data) ? j.data.data : Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

    try {
      let studentUrl = `${API_BASE}/student-master?tenant=${slug}`;
      if (selectedCourseCd) studentUrl += `&courseId=${encodeURIComponent(selectedCourseCd)}`;
      if (selectedBatchCd) studentUrl += `&batchId=${encodeURIComponent(selectedBatchCd)}`;

      const [stMasterRes, resRes] = await Promise.all([
        fetch(studentUrl, { headers }).catch(() => null),
        fetch(`${API_BASE}/exams/results?tenant=${slug}`, { headers }).catch(() => null),
      ]);

      let rawStudents: any[] = [];
      if (stMasterRes && stMasterRes.ok) {
        rawStudents = parse(await stMasterRes.json());
      }

      if (rawStudents.length === 0) {
        const fallbackRes = await fetch(`${API_BASE}/users/students?tenant=${slug}&limit=100`, { headers }).catch(() => null);
        if (fallbackRes && fallbackRes.ok) {
          rawStudents = parse(await fallbackRes.json());
        }
      }

      let existingResults: any[] = [];
      if (resRes && resRes.ok) {
        existingResults = parse(await resRes.json());
      }

      const paperMaxMarks = activePaper?.max_marks || 80;
      const passingMarks = activePaper?.passing_marks || (paperMaxMarks * 0.4);
      const paperQuestions = activePaper?.questions || [];

      if (rawStudents.length > 0) {
        const mapped: StudentTheoryReport[] = rawStudents.map((st: any, idx: number) => {
          const studentRoll = st.rollno || st.registration_no || `ST-${idx + 1}`;
          const studentReg = st.registration_no || st.rollno || studentRoll;

          const matchedResult = existingResults.find((r: any) =>
            (r.rollno && (r.rollno === studentRoll || r.rollno === studentReg)) ||
            (r.registration_no && (r.registration_no === studentReg || r.registration_no === studentRoll)) ||
            r.student_id === st.id ||
            r.student_name === st.name
          );

          const isEvaluated = !!matchedResult;
          const totalObt = matchedResult ? Math.max(0, Number(matchedResult.marks_obtained || 0)) : (isEvaluated ? 60 : 0);
          const isPass = matchedResult ? !!matchedResult.is_pass : (totalObt >= passingMarks);
          const qMarks: { [qId: string]: number } = matchedResult?.question_marks || {};
          const subMarks: { [subKey: string]: number } = matchedResult?.sub_part_marks || {};
          const practicalM = matchedResult?.practical_mark ? Number(matchedResult.practical_mark) : 0;
          const practicalMaxMarks = 40;
          const practicalPct = practicalMaxMarks > 0 ? (practicalM / practicalMaxMarks) * 100 : 0;

          // 4 Practical Assessment Categories
          const practicalCategories: PracticalCategory[] = [
            {
              id: 'cat-1',
              name: 'Lab Performance & Experiment Execution',
              icon: '🔬',
              maxMarks: 15,
              scoredMarks: isEvaluated ? Number(((practicalM / practicalMaxMarks) * 15).toFixed(2)) : 0,
              percentage: practicalPct,
              color: '#5B4BFF',
            },
            {
              id: 'cat-2',
              name: 'Viva Voce & Technical Defense',
              icon: '🗣️',
              maxMarks: 10,
              scoredMarks: isEvaluated ? Number(((practicalM / practicalMaxMarks) * 10).toFixed(2)) : 0,
              percentage: practicalPct,
              color: '#F36C21',
            },
            {
              id: 'cat-3',
              name: 'Practical File & LogBook Evaluation',
              icon: '📖',
              maxMarks: 10,
              scoredMarks: isEvaluated ? Number(((practicalM / practicalMaxMarks) * 10).toFixed(2)) : 0,
              percentage: practicalPct,
              color: '#00C48C',
            },
            {
              id: 'cat-4',
              name: 'Continuous Internal Assessment & Attendance',
              icon: '⏱️',
              maxMarks: 5,
              scoredMarks: isEvaluated ? Number(((practicalM / practicalMaxMarks) * 5).toFixed(2)) : 0,
              percentage: practicalPct,
              color: '#FFB020',
            },
          ];

          // Build dynamic subTopicResults map
          const subTopicMap: {
            [code: string]: { scored: number; totalMax: number; pct: number; questionCount: number; desc?: string };
          } = {};

          // Initialize with paper subtopics
          activePaperSubTopics.forEach((stSummary) => {
            subTopicMap[stSummary.code] = {
              scored: 0,
              totalMax: stSummary.totalMaxMarks,
              pct: 0,
              questionCount: stSummary.questionCount,
              desc: stSummary.desc,
            };
          });

          const attempts: any[] = [];

          paperQuestions.forEach((q, qIdx) => {
            const sCode = q.subTopicCode || 'CO1';
            const qId = q.id || `q-${qIdx}`;
            const subQs = q.subQuestions || [];
            let qScored = 0;
            let qMax = Number(q.maxMarks || 2);

            if (subQs.length > 0) {
              qMax = 0;
              subQs.forEach((sq, sqIdx) => {
                const subKey = `${qId}___${sq.id || sq.label || sqIdx}`;
                const subScore = subMarks[subKey] !== undefined ? Number(subMarks[subKey]) : (subMarks[sq.id] !== undefined ? Number(subMarks[sq.id]) : (isEvaluated ? Number(sq.marks) : 0));
                qScored += subScore;
                qMax += Number(sq.marks || 2.5);
              });
            } else {
              qScored = qMarks[qId] !== undefined ? Number(qMarks[qId]) : (isEvaluated ? qMax : 0);
            }

            if (!subTopicMap[sCode]) {
              subTopicMap[sCode] = { scored: 0, totalMax: 0, pct: 0, questionCount: 0, desc: q.subTopicDesc };
            }

            subTopicMap[sCode].scored += qScored;
            if (!activePaperSubTopics.find(a => a.code === sCode)) {
              subTopicMap[sCode].totalMax += qMax;
              subTopicMap[sCode].questionCount += 1;
            }

            const isCorrect = qScored >= (qMax * 0.5);

            attempts.push({
              questionId: qId,
              qNo: q.qNo,
              part: q.part,
              questionText: q.questionText,
              subTopicCode: sCode,
              subTopicDesc: q.subTopicDesc,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption,
              marksScored: qScored,
              maxMarks: qMax,
              isCorrect,
              statusTag: isCorrect ? 'correct' : qScored > 0 ? 'partial' : 'wrong',
              subQuestions: subQs.map((sq, sqIdx) => {
                const subKey = `${qId}___${sq.id || sq.label || sqIdx}`;
                const subScore = subMarks[subKey] !== undefined ? Number(subMarks[subKey]) : (subMarks[sq.id] !== undefined ? Number(subMarks[sq.id]) : (isEvaluated ? Number(sq.marks) : 0));
                return {
                  id: sq.id,
                  label: sq.label,
                  questionText: sq.questionText || sq.question_text || '',
                  scored: subScore,
                  max: Number(sq.marks || 2.5),
                };
              }),
            });
          });

          // Compute percentages
          Object.keys(subTopicMap).forEach(k => {
            const item = subTopicMap[k];
            item.pct = item.totalMax > 0 ? Math.round((item.scored / item.totalMax) * 100) : 0;
          });

          const completePct = paperMaxMarks > 0 ? Number(((totalObt / paperMaxMarks) * 100).toFixed(2)) : 0;

          return {
            id: st.id || studentRoll,
            rollno: studentRoll,
            registration_no: studentReg,
            name: st.name || `Student ${idx + 1}`,
            gender: st.gender || 'Male',
            course: st.course_code || selectedCourseCd,
            batch: st.batch_code || selectedBatchCd,
            semester: `Sem ${selectedSemCd}`,
            evaluated: isEvaluated,
            marksObtained: totalObt,
            maxMarks: paperMaxMarks,
            percentage: completePct,
            practicalMarks: practicalM,
            practicalMax: practicalMaxMarks,
            practicalPercentage: practicalPct,
            practicalCategories,
            isPass,
            photo_url: st.photo_url,
            questionMarks: qMarks,
            subPartMarks: subMarks,
            subTopicResults: subTopicMap,
            questionAttempts: attempts,
          };
        });

        setStudents(mapped);
      }
    } catch (e) {
      console.error('fetchEvaluatedStudentReports error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchEvaluatedStudentReports();
    }
  }, [selectedCollegeSlug, selectedCourseCd, selectedBatchCd, selectedSemCd, selectedSubjectCd, selectedPaperCode]);

  // ─── Filtered Search Roster ────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollno && String(s.rollno).toLowerCase().includes(q)) ||
      (s.registration_no && String(s.registration_no).toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // ─── Open Student Analysis Modal ───────────────────────────────────────────
  const handleOpenStudentAnalysis = (st: StudentTheoryReport) => {
    setActiveStudent(st);
    const expMap: { [c: string]: boolean } = {};
    activePaperSubTopics.forEach(stSummary => { expMap[stSummary.code] = true; });
    setExpandedSubTopics(expMap);
    setModalTab('subtopics');
    setHoveredSlice(null);
    setModalOpen(true);
  };

  const toggleSubTopicAccordion = (code: string) => {
    setExpandedSubTopics(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const curCourseObj = courses.find(c => String(c.course_cd) === selectedCourseCd);
  const curSubjObj = allSubjects.find(s => s.code === selectedSubjectCd || String(s.subject_cd) === selectedSubjectCd);

  // ─── SVG Pie Slices Calculation with Radial Leader Lines & Labels ──────────
  const pieChartSlices = useMemo(() => {
    if (!activeStudent || activePaperSubTopics.length === 0) return [];
    
    const cx = 275;
    const cy = 180;
    const r = 95;

    const dataItems = activePaperSubTopics.map((stObj, idx) => {
      const stRes = activeStudent.subTopicResults ? activeStudent.subTopicResults[stObj.code] : null;
      const scored = stRes ? stRes.scored : 0;
      const totalMax = stRes ? stRes.totalMax : stObj.totalMaxMarks;
      const pct = stRes ? stRes.pct : 0;
      return {
        code: stObj.code,
        desc: stObj.desc,
        scored,
        totalMax,
        pct,
        val: Math.max(0.5, scored),
        color: CHART_COLORS[idx % CHART_COLORS.length],
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

      // Arc points
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Leader line coordinates
      const isRight = Math.cos(midRad) >= 0;
      const lineStart = { x: cx + (r * 0.9) * Math.cos(midRad), y: cy + (r * 0.9) * Math.sin(midRad) };
      const lineMid = { x: cx + (r + 28) * Math.cos(midRad), y: cy + (r + 28) * Math.sin(midRad) };
      const lineEnd = { x: isRight ? lineMid.x + 22 : lineMid.x - 22, y: lineMid.y };
      const textPos = { x: isRight ? lineEnd.x + 4 : lineEnd.x - 4, y: lineEnd.y + 3.5 };

      return {
        ...item,
        pathData,
        midAngle,
        lineStart,
        lineMid,
        lineEnd,
        textPos,
        isRight,
      };
    });
  }, [activeStudent, activePaperSubTopics]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0B1120] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role={currentRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentRole === 'admin' ? 'Admin MIS Reports — Theory Assessment Results' : 'Faculty MIS Reports — Theory Assessment Results'} />
        
        <main className="p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0B1120]">
          {/* Top Reports Suite Navigation Tabs */}
          <FacultyReportsNav
            activeReport="theory"
            role={currentRole}
            stats={{
              attendanceCount: 'Sessions',
              logbookCount: 'Ledger',
              theoryCount: `${students.length} Evaluated`,
            }}
          />

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* MAIN TITLE BANNER CARD */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B3299] to-[#2D2575] text-white p-6 rounded-[22px] shadow-[0_8px_30px_rgba(45,37,117,0.2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#F36C21] text-white px-3 py-1 rounded-full shadow-sm">
                  ⚡ MIS REPORT 3: THEORY RESULTS &amp; SUBTOPICS
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-indigo-200 font-semibold">
                  Course: {curCourseObj?.name || 'BCA (13)'}
                </span>
                {curSubjObj && (
                  <span className="text-xs font-bold text-amber-300">
                    • Subject: {curSubjObj.name} ({curSubjObj.code})
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white mt-2">
                Evaluated Student Theory Results &amp; SubTopics Analysis Ledger
              </h2>
              <p className="text-xs text-indigo-100/80 mt-1">
                Subject-specific SubTopics performance matrix showing dynamic subcode columns, practical evaluation categories, and complete percentage tracking.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] text-white shadow-lg border border-white/20">
                👥 {students.length} Evaluated Students
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: 7-STEP HIERARCHICAL CASCADING BAR (Order: College->Course->Branch->Batch->Sem->Dept->Subj) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                STEP 1: SELECT HIERARCHY (1. COLLEGE → 2. COURSE → 3. BRANCH → 4. BATCH → 5. SEMESTER → 6. DEPARTMENT → 7. SUBJECT)
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F36C21]/10 text-[#F36C21] border border-[#F36C21]/20">
                Rule 1–5 Strict Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
              {/* 1. College (colg_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-[#F36C21] uppercase mb-1">1. College *</label>
                <select
                  value={selectedColgCd}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedColgCd(val);
                    const found = colleges.find(c => String(c.colg_cd || c.code) === val);
                    if (found) {
                      setSelectedCollegeSlug(found.slug);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('colg_cd', val);
                        localStorage.setItem('tenantSlug', found.slug);
                        localStorage.setItem('selectedTenant', found.slug);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {colleges.map(c => (
                    <option key={c.code || c.slug} value={String(c.colg_cd || c.code)}>
                      [{c.colg_cd || c.code}] {(c.name || '').split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Course (course_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">2. Course *</label>
                <select
                  value={selectedCourseCd}
                  onChange={(e) => setSelectedCourseCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredCourses.map(c => (
                    <option key={c.course_cd || c.code} value={String(c.course_cd || c.code)}>
                      {c.name} ({c.course_cd || c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch (branch_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">3. Branch *</label>
                <select
                  value={selectedBranchCd}
                  onChange={(e) => setSelectedBranchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredBranches.map(b => (
                    <option key={b.branch_cd || b.code} value={b.branch_cd || b.code}>
                      {b.name} ({b.branch_cd || b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Target Batch (batch_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">4. Batch *</label>
                <select
                  value={selectedBatchCd}
                  onChange={(e) => setSelectedBatchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredBatches.length === 0 ? (
                    <option value="">No batches found</option>
                  ) : (
                    filteredBatches.map(b => (
                      <option key={b.code || b.batch_cd} value={b.code || b.batch_cd}>
                        {b.name || `Batch ${b.year}`} ({b.code || b.batch_cd})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 5. Semester (sem_cd: 1–8) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">5. Semester *</label>
                <select
                  value={selectedSemCd}
                  onChange={(e) => setSelectedSemCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* 6. Department (dept_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">6. Department *</label>
                <select
                  value={selectedDeptCd}
                  onChange={(e) => setSelectedDeptCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredDepartments.length === 0 ? (
                    <option value="">No departments</option>
                  ) : (
                    filteredDepartments.map(d => (
                      <option key={d.name || d.code} value={d.name || d.code}>
                        {d.name} {d.course_name ? `(${d.course_name})` : d.code ? `(${d.code})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 7. Subject (subject_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">7. Subject *</label>
                <select
                  value={selectedSubjectCd}
                  onChange={(e) => setSelectedSubjectCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredSubjects.length === 0 ? (
                    <option value="">No subjects found</option>
                  ) : (
                    filteredSubjects.map(s => (
                      <option key={s.code || s.name} value={s.code || String(s.subject_cd || '')}>
                        {s.name} ({s.code || s.subject_cd})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: ACTIVE EXAMINATION PAPERS */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                STEP 2: ACTIVE EXAMINATION PAPERS ({filteredPapers.length} Papers)
              </h3>
              <span className="text-xs font-bold text-slate-500">Select paper to view evaluated results</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPapers.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-slate-400 text-xs font-bold">
                  No examination papers found for this subject.
                </div>
              ) : (
                filteredPapers.map((paper) => {
                  const isActive = paper.code === activePaper?.code;
                  return (
                    <div
                      key={paper.code || paper.id}
                      onClick={() => setSelectedPaperCode(paper.code)}
                      className={`p-4 rounded-[18px] cursor-pointer transition-all duration-200 border relative ${
                        isActive
                          ? 'bg-[#5B4BFF]/5 dark:bg-[#5B4BFF]/15 border-[#5B4BFF] ring-2 ring-[#5B4BFF]/30 shadow-md'
                          : 'bg-[#F6F8FC] dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono text-[#5B4BFF] font-black">[{paper.code}]</span>
                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00C48C] text-white shadow-sm">
                            ✓ Selected Paper
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Select Paper
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{paper.name}</h4>
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Duration: <strong>{paper.duration_mins || 60} mins</strong></span>
                        <span>Max Marks: <strong className="text-[#00C48C]">{paper.max_marks}.00 Marks</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: DYNAMIC SUBTOPICS MATRIX & EVALUATED STUDENTS LEDGER */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  STEP 3: EVALUATED STUDENTS PERFORMANCE &amp; SUBTOPICS ANALYSIS LEDGER ({filteredStudents.length} Students)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Subtopics columns calculate dynamically as <strong>&#123;scored&#125;/&#123;total_max&#125;=&#123;pct&#125;%</strong> with complete percentage tracking for all candidates.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Search Roll No, Reg No, Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  🖨️ Print Ledger
                </button>
              </div>
            </div>

            {/* Results Table with Dynamic SubTopic Columns and Complete Percentage Column */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">Loading student evaluations...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold">No students found matching your search.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-[#F6F8FC] dark:bg-slate-900/50">
                      <th className="py-3 px-3 rounded-l-xl">Roll No</th>
                      <th className="py-3 px-3">Student Name</th>

                      {/* Dynamic SubTopics Columns */}
                      {activePaperSubTopics.map((stCodeObj) => (
                        <th key={stCodeObj.code} className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-mono font-black text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800/40">
                            🎯 {stCodeObj.code}
                          </span>
                        </th>
                      ))}

                      <th className="py-3 px-3 text-center">Theory Score</th>
                      <th className="py-3 px-3 text-center">Practical</th>
                      <th className="py-3 px-3 text-center">Total Marks</th>
                      {/* Complete Percentage Column */}
                      <th className="py-3 px-3 text-center">Percentage (%)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredStudents.map((st) => (
                      <tr key={st.rollno || st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-[#5B4BFF]">
                          {st.rollno}
                          {st.registration_no && st.registration_no !== st.rollno && (
                            <span className="block text-[9px] font-mono text-slate-400">Reg: {st.registration_no}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {st.photo_url ? (
                              <img
                                src={st.photo_url}
                                alt={st.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center font-black text-[10px]">
                                {(st.name || '?').charAt(0)}
                              </div>
                            )}
                            <span className="font-extrabold text-slate-900 dark:text-white">{st.name}</span>
                          </div>
                        </td>

                        {/* Dynamic SubTopic Calculation: {scored}/{totalMax}={pct}% */}
                        {activePaperSubTopics.map((stCodeObj) => {
                          const resData = st.subTopicResults ? st.subTopicResults[stCodeObj.code] : null;
                          if (!st.evaluated || !resData) {
                            return (
                              <td key={stCodeObj.code} className="py-3.5 px-3 text-center text-slate-400 font-mono">
                                —
                              </td>
                            );
                          }

                          const scored = Number(resData.scored || 0);
                          const totalMax = Number(resData.totalMax || stCodeObj.totalMaxMarks || 1);
                          const pct = resData.pct !== undefined ? resData.pct : Math.round((scored / totalMax) * 100);

                          return (
                            <td key={stCodeObj.code} className="py-3.5 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-black bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
                                {scored}/{totalMax}={pct}%
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {st.evaluated ? `${Math.max(0, (st.marksObtained || 0) - (st.practicalMarks || 0)).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-[#F36C21]">
                          {st.evaluated && (st.practicalMarks || 0) > 0 ? `${(st.practicalMarks || 0).toFixed(2)}` : '0.00'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-slate-900 dark:text-white">
                          {st.evaluated ? `${(st.marksObtained || 0).toFixed(2)} / ${st.maxMarks || 80}` : '—'}
                        </td>

                        {/* Complete Percentage Column */}
                        <td className="py-3.5 px-3 text-center">
                          {st.evaluated ? (
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-[11px] border ${
                              (st.percentage || 0) >= 75
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border-emerald-200 dark:border-emerald-800/40'
                                : (st.percentage || 0) >= 50
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border-indigo-200 dark:border-indigo-800/40'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-[#F04438] border-rose-200 dark:border-rose-800/40'
                            }`}>
                              {(st.percentage || 0).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            !st.evaluated
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                              : st.isPass
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          }`}>
                            {!st.evaluated ? 'Pending' : st.isPass ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentAnalysis(st)}
                            className="px-3.5 py-1.5 bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-bold rounded-xl text-xs transition shadow-sm"
                          >
                            View Analysis →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STUDENT ANALYSIS MODAL (4 TABS: SubTopics | Tracking | Practical | Chart) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {modalOpen && activeStudent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1B1E28] rounded-[24px] max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleUp">
                
                {/* 1. Modal Top Bar */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeStudent.photo_url ? (
                      <img src={activeStudent.photo_url} alt={activeStudent.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center font-black text-lg shadow-md">
                        {(activeStudent.name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-[#5B4BFF]">{activeStudent.rollno}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${activeStudent.isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {activeStudent.isPass ? 'Pass' : 'Fail'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{activeStudent.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {curCourseObj?.name || 'BCA'} • Batch: {selectedBatchCd} • Total Score: <strong>{(activeStudent.marksObtained || 0).toFixed(2)} / {activeStudent.maxMarks || 80} ({(activeStudent.percentage || 0).toFixed(2)}%)</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* 2. Modal 4 Tabs Bar (with Practical Assessment before Chart) */}
                <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 bg-slate-100 dark:bg-slate-950/80 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setModalTab('subtopics')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      modalTab === 'subtopics' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🎯</span>
                    <span>1. Questions Comes Under Sections (SubTopics Analysis)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('tracking')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      modalTab === 'tracking' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>📝</span>
                    <span>2. Question Paper Tracking</span>
                  </button>
                  {/* Tab 3: Practical Assessment (Before Chart) */}
                  <button
                    type="button"
                    onClick={() => setModalTab('practical')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      modalTab === 'practical' ? 'border-[#F36C21] text-[#F36C21]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🧪</span>
                    <span>3. Practical Assessment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('chart')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      modalTab === 'chart' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>4. Chart</span>
                  </button>
                </div>

                {/* 3. Modal Body Content */}
                <div className="p-6 overflow-y-auto max-h-[64vh] space-y-4">
                  
                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* TAB 1: Questions Comes Under Sections (SubTopics Analysis) */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {modalTab === 'subtopics' && (
                    <div className="space-y-4">
                      {/* Paper Banner Header */}
                      <div className="p-3.5 rounded-xl bg-emerald-800 text-white flex items-center justify-between text-xs font-bold shadow-sm">
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span>{activePaper?.name || 'Examination Paper'} ({activePaper?.code || selectedPaperCode})</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-100">
                          <span>📅</span>
                          <span>Batch: {selectedBatchCd}</span>
                        </div>
                      </div>

                      {/* SubTopic Groups */}
                      {activePaperSubTopics.map((stSummary, idx) => {
                        const isExp = expandedSubTopics[stSummary.code] !== false;
                        const subData = activeStudent.subTopicResults ? activeStudent.subTopicResults[stSummary.code] : null;
                        const scored = subData ? subData.scored : 0;
                        const totalMax = subData ? subData.totalMax : stSummary.totalMaxMarks;
                        const pct = subData ? subData.pct : 0;

                        // Filter questions under this subtopic
                        const subQuestions = (activeStudent.questionAttempts || []).filter(
                          att => att.subTopicCode === stSummary.code
                        );

                        const colorClass = idx % 2 === 0
                          ? 'bg-[#2D2575] text-white'
                          : 'bg-rose-900 text-white';

                        return (
                          <div key={stSummary.code} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                            {/* SubTopic Banner */}
                            <div
                              onClick={() => toggleSubTopicAccordion(stSummary.code)}
                              className={`p-3 cursor-pointer flex items-center justify-between gap-3 ${colorClass}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-black">
                                  {isExp ? '−' : '+'}
                                </span>
                                <span className="text-xs font-black">
                                  {stSummary.code} {stSummary.desc ? `— ${stSummary.desc}` : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-white/20 text-white border border-white/30">
                                  {scored}/{totalMax} Marks ({pct}%)
                                </span>
                              </div>
                            </div>

                            {/* SubTopic Questions List */}
                            {isExp && (
                              <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
                                {subQuestions.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No questions mapped to this subtopic.</p>
                                ) : (
                                  subQuestions.map((q) => (
                                    <div key={q.questionId} className="p-3 rounded-lg bg-[#F6F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                        <span className="px-2 py-0.5 rounded font-black bg-[#5B4BFF] text-white">
                                          {q.part}
                                        </span>
                                        <span className="px-2 py-0.5 rounded font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                          Q. {q.qNo}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400">
                                          Note:- Tick (✓) the appropriate answer. Each question contains {q.maxMarks || 1} marks.
                                        </span>
                                      </div>

                                      <div className="flex items-start justify-between gap-3 pt-1">
                                        <p className="font-bold text-slate-900 dark:text-white leading-relaxed flex-1">
                                          <span className="text-slate-400 font-mono mr-1.5">Q. {q.qNo}</span>
                                          {q.questionText}
                                        </p>
                                        <span className="px-2.5 py-1 rounded-full font-mono font-black text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                                          ({q.marksScored || 0}/{q.maxMarks || 1})
                                        </span>
                                      </div>

                                      {/* Subparts if any */}
                                      {q.subQuestions && q.subQuestions.length > 0 && (
                                        <div className="pl-4 space-y-1.5 border-l-2 border-slate-300 dark:border-slate-700 pt-1">
                                          {q.subQuestions.map((sq) => (
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

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* TAB 2: Question Paper Tracking */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {modalTab === 'tracking' && (
                    <div className="space-y-6">
                      {/* Group questions by Section */}
                      {['PART A', 'PART B', 'PART C'].map((secName) => {
                        const secQuestions = (activeStudent.questionAttempts || []).filter(q => q.part === secName);
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
                              {secQuestions.map((q) => (
                                <div key={q.questionId} className="space-y-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3 last:border-b-0">
                                  <div className="flex items-start gap-2.5">
                                    <span className={`text-base font-black ${q.isCorrect ? 'text-[#00C48C]' : 'text-[#F04438]'}`}>
                                      {q.isCorrect ? '✓' : '✗'}
                                    </span>
                                    <div className="flex-1">
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        <strong>({q.qNo}).</strong> {q.questionText}
                                        <span className="ml-2 font-mono font-bold text-[#F04438]">
                                          ({q.marksScored || 0}/{q.maxMarks || 1})
                                        </span>
                                      </p>

                                      {/* MCQ Options 2x2 Grid */}
                                      {q.optionA && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-2">
                                          <div className={`p-1.5 rounded-lg border ${q.correctOption === 'option_a' ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(a).</strong> {q.optionA}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${q.correctOption === 'option_b' ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(b).</strong> {q.optionB}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${q.correctOption === 'option_c' ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(c).</strong> {q.optionC}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${q.correctOption === 'option_d' ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(d).</strong> {q.optionD}
                                          </div>
                                        </div>
                                      )}

                                      {/* Sub-parts */}
                                      {q.subQuestions && q.subQuestions.length > 0 && (
                                        <div className="pl-4 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800 mt-2">
                                          {q.subQuestions.map((sq) => (
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

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* TAB 3: Practical Assessment (4 Categories & Dedicated Chart) */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {modalTab === 'practical' && (
                    <div className="space-y-6">
                      {/* Practical Banner */}
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
                            Practical Score: {(activeStudent.practicalMarks || 0).toFixed(2)} / {activeStudent.practicalMax || 40}.00 Marks ({(activeStudent.practicalPercentage || 0).toFixed(2)}%)
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-white text-[#F36C21] shadow-sm">
                            {(activeStudent.practicalPercentage || 0) >= 50 ? '✓ Practical Passed' : '⚠️ Needs Improvement'}
                          </span>
                        </div>
                      </div>

                      {/* 4 Practical Assessment Categories Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(activeStudent.practicalCategories || []).map((cat) => (
                          <div key={cat.id} className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-sm shadow-xs border border-slate-200 dark:border-slate-700">
                                  {cat.icon}
                                </span>
                                <div>
                                  <h5 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                                    {cat.name}
                                  </h5>
                                  <span className="text-[10px] font-bold text-slate-500">
                                    Max: {cat.maxMarks}.00 Marks
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs text-white" style={{ backgroundColor: cat.color }}>
                                {(cat.scoredMarks || 0).toFixed(2)} / {cat.maxMarks}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, cat.percentage || 0)}%`, backgroundColor: cat.color }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span>Performance Score</span>
                                <span>{(cat.percentage || 0).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Practical 4-Category Visual Donut / Bar Comparison */}
                      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                        <h4 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider">
                          4 Categories Distribution &amp; Weightage Breakdown
                        </h4>

                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                          {/* Left Donut */}
                          <div className="relative w-40 h-40">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              {(() => {
                                let accum = 0;
                                const cats = activeStudent.practicalCategories || [];
                                const totalScored = cats.reduce((s, c) => s + Math.max(1, c.scoredMarks || 0), 0) || 1;

                                return cats.map((cat) => {
                                  const slice = (Math.max(1, cat.scoredMarks || 0) / totalScored) * 100;
                                  const dash = `${slice} ${100 - slice}`;
                                  const offset = -accum;
                                  accum += slice;
                                  return (
                                    <circle
                                      key={cat.id}
                                      cx="50"
                                      cy="50"
                                      r="25"
                                      fill="transparent"
                                      stroke={cat.color}
                                      strokeWidth="35"
                                      strokeDasharray={dash}
                                      strokeDashoffset={offset}
                                      className="transition-all duration-300"
                                    />
                                  );
                                });
                              })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                {(activeStudent.practicalMarks || 0).toFixed(1)}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">/ 40.0</span>
                            </div>
                          </div>

                          {/* Right Legend & Summary Table */}
                          <div className="space-y-2 text-left text-xs max-w-sm w-full">
                            {(activeStudent.practicalCategories || []).map((cat) => (
                              <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{(cat.name || '').split('&')[0]}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {(cat.scoredMarks || 0).toFixed(2)} / {cat.maxMarks}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* TAB 4: Chart (SubTopics Progress Chart with Radial Labels) */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {modalTab === 'chart' && (
                    <div className="space-y-6 text-center">
                      {/* Header Result Display (exact red bold title from Screenshot 3) */}
                      <div>
                        <h3 className="text-xl font-black text-[#F04438] tracking-tight uppercase">
                          SUBTOPICS RESULT : {(activeStudent.marksObtained || 0).toFixed(2)} / {activeStudent.maxMarks || 80} = {((((activeStudent.marksObtained || 0) / (activeStudent.maxMarks || 80))) * 100).toFixed(2)}%
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Visual pie distribution of student performance across question paper subtopics with leader lines and formula labels.
                        </p>
                      </div>

                      {/* SVG Pie Chart with Radial Leader Lines and Formatted {4}/{8}={50}% Labels */}
                      <div className="flex flex-col items-center justify-center p-2">
                        <div className="relative w-full max-w-[620px] h-[370px]">
                          <svg viewBox="0 0 550 360" className="w-full h-full">
                            <defs>
                              <filter id="pieShadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                              </filter>
                            </defs>

                            {/* Slices */}
                            <g filter="url(#pieShadow)">
                              {pieChartSlices.map((slice) => {
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

                            {/* Radial Leader Lines and Text Labels */}
                            <g className="pointer-events-none">
                              {pieChartSlices.map((slice) => {
                                const isHov = hoveredSlice === slice.code;
                                return (
                                  <g key={`label-${slice.code}`}>
                                    {/* Leader Line */}
                                    <polyline
                                      points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineMid.x},${slice.lineMid.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                                      fill="none"
                                      stroke={isHov ? '#1B1E28' : slice.color}
                                      strokeWidth={isHov ? '2' : '1.2'}
                                      strokeDasharray={isHov ? 'none' : '2,2'}
                                      className="transition-all duration-200"
                                    />
                                    {/* Anchor Point Circle */}
                                    <circle
                                      cx={slice.lineStart.x}
                                      cy={slice.lineStart.y}
                                      r="2.5"
                                      fill={slice.color}
                                    />
                                    {/* Label: {code} - {scored}/{totalMax}={pct}% */}
                                    <text
                                      x={slice.textPos.x}
                                      y={slice.textPos.y}
                                      textAnchor={slice.isRight ? 'start' : 'end'}
                                      fontSize="11"
                                      fontWeight={isHov ? '900' : '800'}
                                      fill={isHov ? '#1B1E28' : slice.color}
                                      className="font-mono tracking-tight transition-all duration-200"
                                    >
                                      {slice.code} - {slice.scored}/{slice.totalMax}={slice.pct}%
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Comprehensive Formula Legend with {scored}/{totalMax}={pct}% Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 max-w-3xl mx-auto">
                        {pieChartSlices.map((slice) => {
                          const isHov = hoveredSlice === slice.code;
                          return (
                            <div
                              key={slice.code}
                              onMouseEnter={() => setHoveredSlice(slice.code)}
                              onMouseLeave={() => setHoveredSlice(null)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                isHov
                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 scale-105 shadow-sm'
                                  : 'bg-[#F6F8FC] dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: slice.color }} />
                              <span className="font-mono font-black text-slate-900 dark:text-white">{slice.code}</span>
                              <span className="font-mono font-black text-[#5B4BFF] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {slice.scored}/{slice.totalMax}={slice.pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* SubTopics Performance Matrix Table */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-[#F6F8FC] dark:bg-slate-900/50">
                                <th className="py-2.5 px-3 rounded-l-lg">SubTopic Code</th>
                                <th className="py-2.5 px-3">Description</th>
                                <th className="py-2.5 px-3 text-center">Marks Formula</th>
                                <th className="py-2.5 px-3 text-center">Progress</th>
                                <th className="py-2.5 px-3 text-center rounded-r-lg">Percentage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                              {pieChartSlices.map((slice) => (
                                <tr
                                  key={slice.code}
                                  onMouseEnter={() => setHoveredSlice(slice.code)}
                                  onMouseLeave={() => setHoveredSlice(null)}
                                  className={`transition ${hoveredSlice === slice.code ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
                                >
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                                      <span className="font-mono font-black text-[#5B4BFF]">{slice.code}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">
                                    {slice.desc || `SubTopic ${slice.code}`}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                                    {slice.scored} / {slice.totalMax}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="w-28 mx-auto bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, slice.pct)}%`, backgroundColor: slice.color }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2.5 py-0.5 rounded font-mono font-black text-[11px] text-white" style={{ backgroundColor: slice.color }}>
                                      {slice.pct}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* 4. Modal Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-900 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-black rounded-xl text-xs transition shadow-md shadow-[#5B4BFF]/20"
                  >
                    Close Analysis
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
