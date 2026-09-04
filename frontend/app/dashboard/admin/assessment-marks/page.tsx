'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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

interface QuestionDetail {
  questionId?: string;
  id?: string;
  questionText?: string;
  question_text?: string;
  mode: 'MCQ' | 'DESC';
  topic?: string;
  unit_code?: string;
  sub_topic_code?: string;
  competency_code?: string;
  competencyCode?: string;
  marks?: number;
  customMarks?: number;
  defaultMarks?: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  sub_questions?: QuestionSubPart[];
  subQuestions?: QuestionSubPart[];
}

interface PracticalComponent {
  id: string;
  name: string;
  marks: number;
}

interface PaperSection {
  id: string;
  title?: string;
  name?: string;
  type: 'MCQ' | 'DESC' | 'PRACTICAL';
  instructions?: string;
  description?: string;
  targetCount?: number;
  questions?: QuestionDetail[];
  selectedQuestions?: QuestionDetail[];
  practicalComponents?: PracticalComponent[];
  practicalMarks?: number;
}

interface ExamPaper {
  id: string;
  code: string;
  name: string;
  max_marks: number;
  passing_marks: number;
  duration_minutes?: number;
  duration_mins?: number;
  sections_count?: number;
  type?: string;
  status?: string;
  subject_id?: string;
  subject_code?: string;
  batch_id?: string;
  batch_code?: string;
  sections?: PaperSection[];
}

interface StudentRow {
  id: string;
  rollno: string;
  registration_no?: string;
  name: string;
  gender?: string;
  course_cd?: string;
  batch_cd?: string;
  photo_url?: string;
  evaluated: boolean;
  marks_obtained: number;
  max_marks: number;
  competencyScores: { [compCode: string]: { scored: number; max: number } };
  is_pass: boolean;
  questionMarks?: { [qId: string]: number };
  subPartMarks?: { [subKey: string]: number };
  practicalMark?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

export default function AdminAssessmentMarksPage() {
  const [userRole, setUserRole] = useState<string>('ADMIN');

  // ─── 1. Colleges State (Rule 1: colg_cd) ───────────────────────────────────
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColgCd, setSelectedColgCd] = useState<string>(getInitialColgCd);
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>(getInitialTenantSlug);

  // ─── Step 1: 6-Level Cascading Hierarchy (RestrictAPI.md Standard) ─────────
  // Order: 1. College -> 2. Course -> 3. Branch -> 4. Batch -> 5. Semester -> 6. Subject
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('');

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchCd, setSelectedBranchCd] = useState<string>('');

  const [batches, setBatches] = useState<BatchItem[]>([]);
  // Batch MUST be selected by user before subjects/papers are shown
  const [selectedBatchCd, setSelectedBatchCd] = useState<string>('');

  // Semester MUST be selected by user before subjects/papers are shown
  const [selectedSemCd, setSelectedSemCd] = useState<string>('');

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  // Subject defaults to '' — user MUST choose a subject before papers are shown
  const [selectedSubjectCd, setSelectedSubjectCd] = useState<string>('');

  // ─── Step 2: Exam Papers ───────────────────────────────────────────────────
  const [allFetchedPapers, setAllFetchedPapers] = useState<ExamPaper[]>([]);
  const [selectedPaperCode, setSelectedPaperCode] = useState<string>('');

  // ─── Step 3: Students & Roster ─────────────────────────────────────────────
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentRollno, setSelectedStudentRollno] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ─── Scores State (Fully Clamped, Zero-Negative & Sub-Part Isolated) ───────
  const [questionMarksMap, setQuestionMarksMap] = useState<{ [qId: string]: number }>({});
  const [subPartMarksMap, setSubPartMarksMap] = useState<{ [subKey: string]: number }>({});
  const [practicalMarksMap, setPracticalMarksMap] = useState<{ [compId: string]: number }>({});
  const [practicalSectionMark, setPracticalSectionMark] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // ─── Input Refs for Automatic Enter-Key Navigation & Auto-Focus ────────────
  const markInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      const role = (typeof window !== 'undefined' ? (localStorage.getItem('role') || localStorage.getItem('user_role') || 'ADMIN') : 'ADMIN').toUpperCase();
      setUserRole(role);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/college-master/colleges`, { headers });
      if (res.ok) {
        const json = await res.json();
        const rawList: College[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        const list = dedupeBy(rawList, (c: College) => String(c.colg_cd || c.code || c.slug || c.id));

        const currentSlug = getInitialTenantSlug();
        const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;
        const found = list.find((c: College) => 
          (savedColgCd && String(c.colg_cd || c.code) === savedColgCd) ||
          c.slug === currentSlug || String(c.code) === currentSlug || String(c.colg_cd) === currentSlug
        );

        let filteredList = list;
        if (role !== 'SUPER_ADMIN') {
          if (found) {
            filteredList = [found];
          } else {
            filteredList = [{
              id: '1',
              colg_cd: savedColgCd || '1',
              code: savedColgCd || '1',
              name: 'SRMS College of Engineering & Technology, Bareilly',
              slug: currentSlug,
            }];
          }
        }
        setColleges(filteredList);

        if (found) {
          setSelectedCollegeSlug(found.slug);
          setSelectedColgCd(String(found.colg_cd || found.code || '1'));
        } else if (filteredList.length > 0) {
          setSelectedCollegeSlug(filteredList[0].slug);
          setSelectedColgCd(String(filteredList[0].colg_cd || filteredList[0].code || '1'));
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

      // 4. Subjects
      if (sRes && sRes.ok) {
        const sList: Subject[] = parse(await sRes.json());
        setAllSubjects(sList);
      }

      // 6. Exam Papers - dedupe by id, filter out test papers
      if (pRes && pRes.ok) {
        const pList = parse(await pRes.json());
        const seen = new Set<string>();
        const mappedPapers: ExamPaper[] = pList
          .filter((p: any) => {
            // Skip test/placeholder papers
            const code = (p.code || '').toUpperCase();
            if (code === 'EXAM-PAPER' || code === 'TEST' || code === 'DUMMY') return false;
            // Deduplicate by id
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          })
          .map((p: any) => ({
            id: p.id,
            code: p.code || 'PAPER',
            name: p.name || 'Examination Paper',
            max_marks: Number(p.max_marks || 100),
            passing_marks: Number(p.passing_marks || 40),
            duration_minutes: Number(p.duration_minutes || p.duration_mins || 60),
            sections_count: Array.isArray(p.sections) ? p.sections.length : 1,
            type: p.type || 'THEORY_PRACTICAL',
            status: p.status || 'Active',
            subject_id: p.subject_id,
            subject_code: p.subject_code || p.subject_cd,
            batch_id: p.batch_id,
            batch_code: p.batch_code || p.batch_cd,
            semester: p.semester ? String(p.semester) : null,
            sections: Array.isArray(p.sections) ? p.sections : [],
          }));
        setAllFetchedPapers(mappedPapers);
        // Do not auto-select paper - user must choose paper explicitly
        setSelectedPaperCode('');
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
        // SRMS CET: Exclude MBBS and medical courses
        return !isMedCourse;
      }
    });
    return dedupeBy(list, c => String(c.course_cd || c.code || c.id));
  }, [courses, isMedicalCollege]);

  // Do NOT auto-select course — user must pick manually
  // (But if previously selected and list reloads, keep it if still valid)
  useEffect(() => {
    if (filteredCourses.length > 0 && selectedCourseCd) {
      const exists = filteredCourses.some(c => String(c.course_cd) === selectedCourseCd || c.code === selectedCourseCd);
      if (!exists) {
        // If previous selection no longer valid, reset to empty
        setSelectedCourseCd('');
      }
    }
  }, [filteredCourses]);

  // ─── Filter Branches by Selected Course ────────────────────────────────────
  const filteredBranches = useMemo(() => {
    const list = branches.filter(b => {
      if (isMedicalCollege) {
        return b.name.includes('Department of') || b.code === 'ANA' || b.code === 'PHY';
      }
      const isMed = b.code === 'ANA' || b.code === 'PHY' || b.name.toLowerCase().includes('anatomy') || b.name.toLowerCase().includes('physiology');
      if (isMed) return false;
      if (!selectedCourseCd) return true;
      // First try exact match by course_cd
      return String(b.course_cd) === String(selectedCourseCd);
    });
    // Fallback: show all non-medical if no course-specific ones found
    const nonMed = branches.filter(b => {
      const isMed = b.code === 'ANA' || b.code === 'PHY' || b.name.toLowerCase().includes('anatomy') || b.name.toLowerCase().includes('physiology');
      return !isMed;
    });
    const base = list.length > 0 ? list : (nonMed.length > 0 ? nonMed : [{ branch_cd: '1', code: '1', name: 'General Branch (1)' }]);
    // Composite key: branch_cd + course_cd so BCA(1) and CSE(1) coexist
    return dedupeBy(base, b => `${b.branch_cd || b.code || b.id}|${(b as any).course_cd || ''}`);
  }, [branches, selectedCourseCd, isMedicalCollege]);

  useEffect(() => {
    if (filteredBranches.length > 0 && selectedBranchCd) {
      const exists = filteredBranches.some(b => b.branch_cd === selectedBranchCd || b.code === selectedBranchCd);
      if (!exists) {
        setSelectedBranchCd('');
      }
    }
  }, [filteredBranches]);

  // ─── Filter Batches by Selected Course & Branch ────────────────────────────
  const filteredBatches = useMemo(() => {
    const list = batches.filter(b => {
      if (!selectedCourseCd) return true;
      return String(b.course_cd) === String(selectedCourseCd) || b.code?.includes(`C${selectedCourseCd}`);
    });
    return dedupeBy(list, b => String(b.code || b.batch_cd || b.id));
  }, [batches, selectedCourseCd]);

  // Do NOT auto-select batch — user must pick batch & semester before subjects load
  useEffect(() => {
    if (filteredBatches.length > 0 && selectedBatchCd) {
      const exists = filteredBatches.some(b => b.code === selectedBatchCd || b.batch_cd === selectedBatchCd);
      if (!exists) {
        setSelectedBatchCd('');
        setSelectedSemCd('');
        setSelectedSubjectCd('');
        setSelectedPaperCode('');
        setStudents([]);
      }
    }
  }, [filteredBatches]);

  // ─── Filter Subjects by Course & Semester (only when batch+semester selected) ─
  const filteredSubjects = useMemo(() => {
    // Require batch and semester to be selected first
    if (!selectedBatchCd || !selectedSemCd) return [];

    const matched = allSubjects.filter(s => {
      // Exclude medical if CET
      const sName = (s.name || '').toLowerCase();
      const sCode = (s.code || '').toLowerCase();
      const isMed = sCode.startsWith('ana') || sCode.startsWith('phy') || sName.includes('anatomy') || sName.includes('physiology');
      if (!isMedicalCollege && isMed) return false;

      // Filter by course
      if (selectedCourseCd && s.course_cd && String(s.course_cd) !== String(selectedCourseCd)) {
        return false;
      }
      // Filter by semester if subject has semester metadata
      if (selectedSemCd && s.semester && String(s.semester) !== String(selectedSemCd)) {
        return false;
      }
      return true;
    });

    // If course-filtered results exist, use them; otherwise show all non-medical
    const base = matched.length > 0 ? matched : allSubjects.filter(s => {
      const sCode = (s.code || '').toLowerCase();
      const sName = (s.name || '').toLowerCase();
      return !sCode.startsWith('ana') && !sCode.startsWith('phy') && !sName.includes('anatomy') && !sName.includes('physiology');
    });
    return dedupeBy(base, s => String(s.subject_cd || s.code || s.name || s.id));
  }, [allSubjects, selectedCourseCd, selectedBatchCd, selectedSemCd, isMedicalCollege]);

  // When subject list reloads, do NOT auto-select — keep '' until user picks
  useEffect(() => {
    if (selectedSubjectCd && filteredSubjects.length > 0) {
      const exists = filteredSubjects.some(s => s.code === selectedSubjectCd || String(s.subject_cd) === selectedSubjectCd);
      if (!exists) {
        // Previous subject no longer in filtered list — reset
        setSelectedSubjectCd('');
        setSelectedPaperCode('');
        setStudents([]);
        setSelectedStudentRollno(null);
      }
    }
  }, [filteredSubjects]);

  // ─── Filtered Exam Papers: Requires Batch + Semester + Subject all selected ──
  const filteredPapers = useMemo(() => {
    // GATE: Do not show any papers until batch, semester AND subject are all selected
    if (!selectedBatchCd || !selectedSemCd || !selectedSubjectCd) return [];
    if (allFetchedPapers.length === 0) return [];

    const selSubjObj = allSubjects.find(s =>
      String(s.code) === String(selectedSubjectCd) ||
      String(s.subject_cd) === String(selectedSubjectCd) ||
      String(s.id) === String(selectedSubjectCd)
    );
    const subjId   = selSubjObj?.id   ? String(selSubjObj.id).toLowerCase().trim()   : '';
    const subjCode = (selSubjObj?.code || selectedSubjectCd || '').toLowerCase().trim();
    const subjCd   = String(selSubjObj?.subject_cd || '').toLowerCase().trim();
    const subjName = (selSubjObj?.name || '').toLowerCase().trim();

    // Strictly match papers to this EXACT subject — no fuzzy fallback!
    const matched = allFetchedPapers.filter(p => {
      // Skip demo/test/placeholder papers
      const pCode = (p.code || '').toUpperCase();
      if (pCode === 'DEMO-PAPER-01' || pCode === 'EXAM-PAPER' || pCode === 'TEST' || pCode === 'DUMMY') return false;

      // 1. Direct subject UUID match (most reliable)
      if (p.subject_id && subjId && String(p.subject_id).toLowerCase() === subjId) return true;
      // 2. Subject numeric code match
      if (p.subject_code) {
        const pSubCode = String(p.subject_code).toLowerCase().trim();
        if (pSubCode === subjCode || (subjCd && pSubCode === subjCd)) return true;
      }
      // 3. Paper code contains subject code (e.g. 'WT-UNIT-2026-1' for subject code 'WT')
      if (subjCode && subjCode.length >= 2 && p.code.toLowerCase().includes(subjCode)) return true;
      // 4. Paper name exactly contains full subject name
      if (subjName && subjName.length >= 5 && p.name) {
        const pNameLower = p.name.toLowerCase();
        if (pNameLower.includes(subjName)) return true;
      }
      // 5. Explicit subject_name on paper matches
      if ((p as any).subject_name && subjName) {
        const pSubjName = String((p as any).subject_name).toLowerCase();
        if (pSubjName === subjName || pSubjName.includes(subjName)) return true;
      }
      return false;
    });

    // Deduplicate by paper id — NEVER fallback to unrelated papers!
    return dedupeBy(matched, p => p.id || p.code);
  }, [allFetchedPapers, selectedSubjectCd, selectedBatchCd, selectedSemCd, allSubjects]);

  const activePaper = useMemo(() => {
    if (!selectedPaperCode) return null;
    return filteredPapers.find(p => p.code === selectedPaperCode) || null;
  }, [filteredPapers, selectedPaperCode]);

  // ─── Fetch Students Directly from PostgreSQL Student Master ─────────────────
  const fetchStudentRoster = async () => {
    if (!activePaper || !selectedPaperCode) {
      setStudents([]);
      setSelectedStudentRollno(null);
      return;
    }

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
        fetch(`${API_BASE}/exams/results?tenant=${slug}&paperId=${encodeURIComponent(activePaper.id || activePaper.code)}`, { headers }).catch(() => null),
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

      const maxPaperMarks = activePaper?.max_marks || 80;
      const passingMarks = activePaper?.passing_marks || (maxPaperMarks * 0.4);

      if (rawStudents.length > 0) {
        // Deduplicate students by rollno + registration_no to prevent duplicate rows
        const seenStudents = new Set<string>();
        const dedupedStudents = rawStudents.filter((st: any) => {
          const key = st.rollno || st.registration_no || st.id;
          if (!key || seenStudents.has(key)) return false;
          seenStudents.add(key);
          return true;
        });

        const mapped: StudentRow[] = dedupedStudents.map((st: any, idx: number) => {
          const studentRoll = st.rollno || st.registration_no || `ST-${idx + 1}`;
          const studentReg = st.registration_no || st.rollno || studentRoll;

          const matchedResult = existingResults.find((r: any) => {
            // Student identity check
            const matchesStudent =
              (r.rollno && (r.rollno === studentRoll || r.rollno === studentReg)) ||
              (r.registration_no && (r.registration_no === studentReg || r.registration_no === studentRoll)) ||
              (r.student_id && String(r.student_id) === String(st.id));
              // Note: deliberately NOT matching by student_name alone (too error-prone for common names)

            // STRICT paper match — a result MUST belong to the EXACT active paper UUID
            const matchesPaper =
              Boolean(r.paper_id && activePaper?.id && String(r.paper_id) === String(activePaper.id));

            return matchesStudent && matchesPaper;
          });

          const totalObt = matchedResult ? Math.max(0, Number(matchedResult.marks_obtained || 0)) : 0;
          const isEvaluated = !!matchedResult;
          const isPass = matchedResult ? !!matchedResult.is_pass : (totalObt >= passingMarks);

          return {
            id: st.id || studentRoll,
            rollno: studentRoll,
            registration_no: studentReg,
            name: st.name || `Student ${idx + 1}`,
            gender: st.gender || 'Male',
            course_cd: st.course_code || st.course_cd,
            batch_cd: st.batch_code || st.batch_cd,
            photo_url: st.photo_url,
            evaluated: isEvaluated,
            marks_obtained: totalObt,
            max_marks: maxPaperMarks,
            competencyScores: {
              'CO1': { scored: isEvaluated ? Number(totalObt.toFixed(2)) : 0, max: maxPaperMarks },
              'PYTH1.1': { scored: isEvaluated ? Number(totalObt.toFixed(2)) : 0, max: maxPaperMarks },
            },
            is_pass: isPass,
            questionMarks: matchedResult?.question_marks || {},
            subPartMarks: matchedResult?.sub_part_marks || {},
            practicalMark: matchedResult?.practical_mark ? Number(matchedResult.practical_mark) : 0,
          };
        });

        setStudents(mapped);
        if (mapped.length > 0 && !selectedStudentRollno) {
          // Auto-select first pending (non-evaluated) student
          const firstPending = mapped.find(s => !s.evaluated);
          setSelectedStudentRollno(firstPending?.rollno || mapped[0].rollno);
        }
      } else {
        setStudents([]);
        setSelectedStudentRollno(null);
      }
    } catch (e) {
      console.error('fetchStudentRoster error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Only load students when a paper is clicked/active
  useEffect(() => {
    if (selectedCollegeSlug && selectedPaperCode && activePaper) {
      fetchStudentRoster();
    } else {
      setStudents([]);
      setSelectedStudentRollno(null);
    }
  }, [selectedCollegeSlug, selectedCourseCd, selectedBatchCd, selectedPaperCode]);

  // ─── Filtered Search Roster ────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      String(s.rollno).toLowerCase().includes(q) ||
      String(s.registration_no || '').toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.rollno === selectedStudentRollno || s.id === selectedStudentRollno) || null;
  }, [students, selectedStudentRollno]);

  // ─── Initialize Scores with Saved Database Values or Defaults ──────────────
  useEffect(() => {
    if (!selectedStudent || !activePaper?.sections) return;

    const qMarks: { [qId: string]: number } = {};
    const subMarks: { [subKey: string]: number } = {};
    const pMarks: { [compId: string]: number } = {};
    let practicalTotal = 0;

    // Check if student has saved marks from database
    const hasSavedQMarks = selectedStudent.questionMarks && Object.keys(selectedStudent.questionMarks).length > 0;
    const hasSavedSubMarks = selectedStudent.subPartMarks && Object.keys(selectedStudent.subPartMarks).length > 0;

    activePaper.sections.forEach(sec => {
      const qList = sec.selectedQuestions || sec.questions || [];

      if (sec.type === 'PRACTICAL') {
        const comps = sec.practicalComponents || [
          { id: 'p1', name: 'Lab Experiment Execution', marks: 20 },
          { id: 'p2', name: 'Viva Voce Examination', marks: 10 },
          { id: 'p3', name: 'Record Book / Portfolio', marks: 5 },
          { id: 'p4', name: 'Continuous Internal Assessment', marks: 5 },
        ];
        const maxTotalPractical = comps.reduce((a, b) => a + Number(b.marks || 0), 0) || 40;
        const actualPracticalTotal = (selectedStudent.practicalMark !== undefined && selectedStudent.practicalMark > 0)
          ? Number(selectedStudent.practicalMark)
          : (selectedStudent.evaluated ? Math.round(maxTotalPractical * 0.85) : 0);

        let runningSum = 0;
        comps.forEach((c, idx) => {
          let compVal = 0;
          if (idx === comps.length - 1) {
            compVal = Math.max(0, actualPracticalTotal - runningSum);
          } else {
            compVal = Math.round((c.marks / maxTotalPractical) * actualPracticalTotal);
            runningSum += compVal;
          }
          pMarks[c.id] = Math.min(c.marks, compVal);
        });
        practicalTotal = actualPracticalTotal;
      } else {
        qList.forEach((q, qIdx) => {
          const qId = q.questionId || q.id || `q-${qIdx}`;
          const subQs = q.sub_questions || q.subQuestions;
          const maxQMark = Number(q.marks || q.customMarks || q.defaultMarks || 2);

          if (Array.isArray(subQs) && subQs.length > 0) {
            subQs.forEach((sq, sqIdx) => {
              const subKey = `${qId}___${sq.id || sq.label || sqIdx}`;
              if (hasSavedSubMarks && selectedStudent.subPartMarks![subKey] !== undefined) {
                subMarks[subKey] = Number(selectedStudent.subPartMarks![subKey]);
              } else if (hasSavedSubMarks && selectedStudent.subPartMarks![sq.id] !== undefined) {
                subMarks[subKey] = Number(selectedStudent.subPartMarks![sq.id]);
              } else {
                subMarks[subKey] = 0;
              }
            });
          } else {
            if (hasSavedQMarks && selectedStudent.questionMarks![qId] !== undefined) {
              qMarks[qId] = Number(selectedStudent.questionMarks![qId]);
            } else {
              qMarks[qId] = 0;
            }
          }
        });
      }
    });

    if (selectedStudent.practicalMark !== undefined && selectedStudent.practicalMark > 0) {
      practicalTotal = Number(selectedStudent.practicalMark);
    }

    setQuestionMarksMap(qMarks);
    setSubPartMarksMap(subMarks);
    setPracticalMarksMap(pMarks);
    setPracticalSectionMark(practicalTotal);
  }, [selectedStudentRollno, selectedPaperCode, activePaper, selectedStudent?.evaluated]);

  // ─── Score Update Handlers with Clamping (0 <= Mark <= MaxMarks) ───────────
  const handleUpdateQMark = (qId: string, mark: number, maxAllowed: number) => {
    const clamped = Math.max(0, Math.min(Number(mark) || 0, maxAllowed));
    setQuestionMarksMap(prev => ({ ...prev, [qId]: clamped }));
  };

  const handleUpdateSubMark = (subKey: string, mark: number, maxAllowed: number) => {
    const clamped = Math.max(0, Math.min(Number(mark) || 0, maxAllowed));
    setSubPartMarksMap(prev => ({ ...prev, [subKey]: clamped }));
  };

  const handleUpdatePracticalCompMark = (compId: string, mark: number, maxAllowed: number) => {
    const clamped = Math.max(0, Math.min(Number(mark) || 0, maxAllowed));
    setPracticalMarksMap(prev => {
      const updated = { ...prev, [compId]: clamped };
      const sum = Object.values(updated).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
      setPracticalSectionMark(sum);
      return updated;
    });
  };

  // ─── Real-Time Grand Total Marks Calculator (Zero-Negative Guaranteed) ────
  const calculatedStudentTotal = useMemo(() => {
    const mainQTotal = Object.values(questionMarksMap).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
    const subQTotal = Object.values(subPartMarksMap).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
    const practicalSum = Object.values(practicalMarksMap).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
    const total = mainQTotal + subQTotal + (practicalSum || practicalSectionMark || 0);
    return Math.max(0, total);
  }, [questionMarksMap, subPartMarksMap, practicalMarksMap, practicalSectionMark]);

  // ─── Select Student with Auto-Focus to First Question Input ────────────────
  const handleSelectStudent = (rollno: string) => {
    setSelectedStudentRollno(rollno);
    setTimeout(() => {
      if (markInputRefs.current[0]) {
        markInputRefs.current[0].focus();
        markInputRefs.current[0].select();
      }
    }, 120);
  };

  // ─── Save Student Evaluation to Backend PostgreSQL ─────────────────────────
  const handleSaveStudentEvaluation = async () => {
    if (!selectedStudent || !activePaper) return;
    setSaving(true);
    const slug = selectedCollegeSlug;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': slug,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const maxMarks = activePaper.max_marks || 80;
    const passingMarks = activePaper.passing_marks || (maxMarks * 0.4);
    const isPass = calculatedStudentTotal >= passingMarks;

    try {
      const res = await fetch(`${API_BASE}/exams/results?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: selectedStudent.id,
          rollno: selectedStudent.rollno,
          registrationNo: selectedStudent.registration_no,
          studentName: selectedStudent.name,
          paperId: activePaper.id || activePaper.code,
          paperCode: activePaper.code,
          marksObtained: calculatedStudentTotal,
          questionMarks: questionMarksMap,
          subPartMarks: subPartMarksMap,
          practicalMark: practicalSectionMark,
          isPass,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save result in database');
      }

      setStudents(prev => {
        const nextList = prev.map(s => {
          if (s.rollno !== selectedStudent.rollno) return s;
          return {
            ...s,
            evaluated: true,
            marks_obtained: calculatedStudentTotal,
            is_pass: isPass,
            questionMarks: questionMarksMap,
            subPartMarks: subPartMarksMap,
            practicalMark: practicalSectionMark,
          };
        });

        // Automatically advance to the next pending student in the roster
        const nextPending = nextList.find(s => !s.evaluated && s.rollno !== selectedStudent.rollno);
        if (nextPending) {
          setTimeout(() => handleSelectStudent(nextPending.rollno), 100);
        }

        return nextList;
      });

      setSaveSuccessMsg(`Evaluation for ${selectedStudent.name} (${calculatedStudentTotal.toFixed(2)} / ${maxMarks} Marks) saved successfully to PostgreSQL database!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error('Save evaluation error:', e);
      setSaveSuccessMsg(`Error: ${e.message || 'Failed to persist evaluation'}`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } finally {
      setSaving(false);
    }
  };


  // Reset input refs before each render pass
  let inputSeqCounter = 0;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0B1120] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Gradebook & Assessment Scores" />
        <main className="p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0B1120]">

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* HEADER BANNER & COLLEGE SWITCHER */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#11141A] via-[#1E232F] to-[#11141A] border border-white/10 text-white p-6 rounded-[22px] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-[#F36C21] text-white px-3 py-1 rounded-full shadow-sm">
                  ⚡ Assessment &amp; Marks Control
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-orange-200 font-semibold">
                  Course: {courses.find(c => String(c.course_cd) === selectedCourseCd)?.name || 'BCA (13)'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-2">
                Assessment Marks Evaluation &amp; Question Scoring
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Evaluate student answer sheets question-by-question with auto-clamping, Enter-key keyboard navigation, and instant ledger sync.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* College Switcher */}
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-orange-200 uppercase tracking-wider mb-0.5">
                    1. College (colg_cd)
                  </label>
                  <select
                    value={selectedColgCd}
                    disabled={userRole !== 'SUPER_ADMIN'}
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
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                  >
                    {colleges.map((c) => (
                      <option key={c.code || c.slug} value={String(c.colg_cd || c.code)} className="text-slate-900 bg-white">
                        [{c.colg_cd || c.code || '1'}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {userRole !== 'SUPER_ADMIN' && (
                  <span className="text-[9px] bg-orange-500/20 text-orange-200 font-black px-1.5 py-0.5 rounded border border-orange-400/30 shrink-0">
                    🔒 Locked
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveStudentEvaluation}
                disabled={saving || !selectedStudent}
                className="px-6 py-3 bg-[#F36C21] hover:bg-[#E05B10] text-white font-black rounded-xl text-xs shadow-lg shadow-orange-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Student Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-md animate-fadeIn">
              ✅ {saveSuccessMsg}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: 6-STEP HIERARCHICAL CASCADING BAR (Order: College->Course->Branch->Batch->Sem->Subj) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#11141A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F36C21] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                STEP 1: SELECT HIERARCHY (1. COLLEGE → 2. COURSE → 3. BRANCH → 4. BATCH → 5. SEMESTER → 6. SUBJECT)
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F36C21]/10 text-[#F36C21] border border-[#F36C21]/20">
                Rule 1–5 Strict Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* 1. College (colg_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-[#F36C21] uppercase mb-1">1. College *</label>
                <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <span>🏛️</span>
                  </span>
                  <select
                    value={selectedColgCd}
                    disabled={userRole !== 'SUPER_ADMIN'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedColgCd(val);
                      setSelectedPaperCode('');
                      setStudents([]);
                      setSelectedStudentRollno(null);
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
                    className="w-full bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed text-xs truncate"
                  >
                    {colleges.map(c => (
                      <option key={c.code || c.slug} value={String(c.colg_cd || c.code)}>
                        [{c.colg_cd || c.code}] {c.name.split(',')[0]}
                      </option>
                    ))}
                  </select>
                  {userRole !== 'SUPER_ADMIN' && (
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                      🔒 Locked
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Course (course_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">2. Course *</label>
                <select
                  value={selectedCourseCd}
                  onChange={(e) => {
                    setSelectedCourseCd(e.target.value);
                    setSelectedPaperCode('');
                    setStudents([]);
                    setSelectedStudentRollno(null);
                  }}
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
                  onChange={(e) => {
                    setSelectedBranchCd(e.target.value);
                    setSelectedPaperCode('');
                    setStudents([]);
                    setSelectedStudentRollno(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredBranches.map(b => (
                    <option key={b.branch_cd || b.code} value={b.branch_cd || b.code}>
                      {b.name} ({b.branch_cd || b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Target Batch (batch_cd) — MUST be selected before subject/papers appear */}
              <div>
                <label className="block text-[10px] font-bold text-[#5B4BFF] dark:text-purple-400 uppercase mb-1">4. Batch *</label>
                <select
                  value={selectedBatchCd}
                  onChange={(e) => {
                    setSelectedBatchCd(e.target.value);
                    setSelectedSemCd('');
                    setSelectedSubjectCd('');
                    setSelectedPaperCode('');
                    setStudents([]);
                    setSelectedStudentRollno(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#5B4BFF]/40 dark:border-purple-700 text-slate-900 dark:text-white font-black focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="">— Select Batch —</option>
                  {filteredBatches.length === 0 ? (
                    <option disabled value="">No batches found</option>
                  ) : (
                    filteredBatches.map(b => (
                      <option key={b.code || b.batch_cd} value={b.code || b.batch_cd}>
                        {b.name || `Batch ${b.year}`} ({b.code || b.batch_cd})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 5. Semester — MUST be selected before subject/papers appear */}
              <div>
                <label className="block text-[10px] font-bold text-[#5B4BFF] dark:text-purple-400 uppercase mb-1">5. Semester *</label>
                <select
                  value={selectedSemCd}
                  onChange={(e) => {
                    setSelectedSemCd(e.target.value);
                    setSelectedSubjectCd('');
                    setSelectedPaperCode('');
                    setStudents([]);
                    setSelectedStudentRollno(null);
                  }}
                  disabled={!selectedBatchCd}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#5B4BFF]/40 dark:border-purple-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">— Select Semester —</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* 6. Subject (subject_cd) — requires batch+semester first */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">6. Subject *</label>
                <select
                  value={selectedSubjectCd}
                  onChange={(e) => {
                    setSelectedSubjectCd(e.target.value);
                    setSelectedPaperCode('');
                    setStudents([]);
                    setSelectedStudentRollno(null);
                  }}
                  disabled={!selectedBatchCd || !selectedSemCd}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Always show a "Select Subject" placeholder as the default (value='') */}
                  <option value="">— Select Subject —</option>
                  {!selectedBatchCd || !selectedSemCd ? (
                    <option disabled value="">Select Batch &amp; Semester first</option>
                  ) : filteredSubjects.length === 0 ? (
                    <option disabled value="">No subjects for selected filters</option>
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
          {/* STEP 2: DESIGNED & APPROVED EXAMINATION PAPERS */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#11141A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F36C21] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                STEP 2: EXAMINATION PAPERS {filteredPapers.length > 0 ? `(${filteredPapers.length} Found)` : ''}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Select a paper to load student roster</span>
              </div>
            </div>

            {/* Papers Grid — gated behind batch + semester + subject selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gate 1: Batch not selected */}
              {!selectedBatchCd ? (
                <div className="col-span-1 md:col-span-3 py-10 px-4 text-center rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-dashed border-purple-300 dark:border-purple-700 space-y-2">
                  <div className="text-2xl">🎓</div>
                  <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Select a Batch first
                  </div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 max-w-sm mx-auto">
                    Choose the <strong>Batch</strong> (Step 1 → Field 4) to continue. Papers are designed per batch and semester.
                  </div>
                </div>
              /* Gate 2: Semester not selected */
              ) : !selectedSemCd ? (
                <div className="col-span-1 md:col-span-3 py-10 px-4 text-center rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-dashed border-purple-300 dark:border-purple-700 space-y-2">
                  <div className="text-2xl">📅</div>
                  <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Select a Semester
                  </div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 max-w-sm mx-auto">
                    Choose the <strong>Semester</strong> (Step 1 → Field 5) to filter subjects for this batch.
                  </div>
                </div>
              /* Gate 3: Subject not selected */
              ) : !selectedSubjectCd ? (
                <div className="col-span-1 md:col-span-3 py-10 px-4 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="text-2xl">📚</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Select a Subject
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Choose a <strong>Subject</strong> (Step 1 → Field 7) to see its designed examination papers.
                  </div>
                </div>
              /* Gate 4: Subject selected but no papers exist */
              ) : filteredPapers.length === 0 ? (
                <div className="col-span-1 md:col-span-3 py-10 px-4 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <div className="text-2xl">📝</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No examination papers for this subject yet
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Select another subject or design a new exam paper for <strong>{allSubjects.find(s => String(s.code) === String(selectedSubjectCd) || String(s.subject_cd) === String(selectedSubjectCd))?.name || 'this subject'}</strong> in Assessment Designer.
                  </div>
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
                          ? 'bg-[#F36C21]/5 dark:bg-[#F36C21]/15 border-[#F36C21] ring-2 ring-[#F36C21]/30 shadow-md'
                          : 'bg-[#F6F8FC] dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono text-[#F36C21] font-black">[{paper.code}]</span>
                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00C48C] text-white shadow-sm">
                            ✓ Active Paper
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF]">
                            Click to Select
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{paper.name}</h4>
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Duration: <strong>{paper.duration_minutes || paper.duration_mins || 60} mins</strong></span>
                        <span>Max Marks: <strong className="text-[#00C48C]">{paper.max_marks}.00 Marks</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: SPLIT VIEW — ROSTER ON LEFT & SECTION-WISE QUESTION EVALUATION ON RIGHT */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {!selectedPaperCode || !activePaper ? (
            <div className="p-12 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center text-3xl font-black">
                📋
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                No Examination Paper Selected
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Please click on an examination paper in <strong>Step 2</strong> above. The student roster and evaluation marksheet will load once a paper is clicked.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Batch Students Roster */}
            <div className="lg:col-span-5 p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  STUDENTS ROSTER ({filteredStudents.length})
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#5B4BFF]">[{selectedBatchCd}]</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search Student Name, Roll No or Reg No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] placeholder-slate-400"
                />
              </div>

              {/* Roster List */}
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">Loading student roster...</div>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filteredStudents.map((st) => {
                    const isSelected = st.rollno === selectedStudentRollno;
                    const isCompleted = st.evaluated;
                    return (
                      <div
                        key={st.rollno || st.id}
                        onClick={() => {
                          handleSelectStudent(st.rollno);
                        }}
                        title={isCompleted ? 'Evaluated — click to review' : 'Click to evaluate'}
                        className={`p-3.5 rounded-xl transition-all duration-150 border flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#5B4BFF] border-[#5B4BFF] text-white shadow-md ring-2 ring-[#5B4BFF]/30'
                            : isCompleted
                              ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 hover:border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                              : 'bg-[#F6F8FC] dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-400 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {st.photo_url ? (
                            <img
                              src={st.photo_url}
                              alt={st.name}
                              className={`w-8 h-8 rounded-full object-cover border ${isSelected ? 'border-white/40' : 'border-slate-200 dark:border-slate-700'}`}
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#F36C21] text-white'
                            }`}>
                              {st.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono font-bold ${
                                isSelected
                                  ? 'text-white/90'
                                  : 'text-[#F36C21]'
                              }`}>
                                {st.rollno}
                              </span>
                              {st.evaluated ? (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                  isSelected
                                    ? 'bg-white/20 text-white border-white/40'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                }`}>
                                  ✓ Evaluated
                                </span>
                              ) : (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                  isSelected
                                    ? 'bg-white/20 text-white border-white/40'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                }`}>
                                  Pending
                                </span>
                              )}
                            </div>
                            <h5 className={`text-xs font-extrabold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {st.name}
                            </h5>
                            {st.registration_no && st.registration_no !== st.rollno && (
                              <span className={`text-[9px] font-mono block ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                                Reg: {st.registration_no}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-black ${
                            isSelected
                              ? 'text-white'
                              : isCompleted
                                ? 'text-[#00C48C]'
                                : 'text-slate-400'
                          }`}>
                            {Math.max(0, st.marks_obtained).toFixed(2)} / {st.max_marks}
                          </span>
                          <span className={`block text-[9px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                            Total Score
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Section-Wise Question Evaluation with Clamping & Keyboard Navigation */}
            <div className="lg:col-span-7 p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5 flex flex-col justify-between">
              {selectedStudent ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#5B4BFF] uppercase tracking-widest">
                        Evaluating Student Answer Sheet
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Roll No: {selectedStudent.rollno} • Reg No: {selectedStudent.registration_no || selectedStudent.rollno} • Batch: {selectedBatchCd}
                      </p>
                    </div>

                    <div className="text-right bg-[#F6F8FC] dark:bg-slate-900 p-3 rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Calculated Total Score</span>
                      <span className={`text-xl font-black ${calculatedStudentTotal > 0 ? 'text-[#00C48C]' : 'text-slate-700 dark:text-slate-200'}`}>
                        {calculatedStudentTotal.toFixed(2)} / {activePaper?.max_marks || 80}
                      </span>
                    </div>
                  </div>

                  {/* Full Section-Wise Questions & Sub-parts Evaluation */}
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {activePaper?.sections?.map((sec) => {
                      const qList = sec.selectedQuestions || sec.questions || [];
                      return (
                        <div key={sec.id} className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <h4 className="text-xs font-extrabold text-[#5B4BFF] uppercase">
                              {sec.title || sec.name} ({sec.type})
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{sec.instructions || sec.description}</span>
                          </div>

                          {sec.type === 'PRACTICAL' ? (
                            <div className="space-y-2">
                              {(sec.practicalComponents || [
                                { id: 'p1', name: 'Lab Experiment / Practical Execution', marks: 20 },
                                { id: 'p2', name: 'Viva Voce / Oral Examination', marks: 10 },
                                { id: 'p3', name: 'Practical Record Book / Logbook', marks: 5 },
                                { id: 'p4', name: 'Continuous Internal Assessment', marks: 5 },
                              ]).map((comp) => {
                                const currentInputIdx = inputSeqCounter++;
                                return (
                                  <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-[#E7EAF3] dark:border-slate-800">
                                    <div>
                                      <p className="text-xs font-bold text-slate-900 dark:text-white">🧪 {comp.name}</p>
                                      <span className="text-[10px] text-slate-400">Max Allocation: {comp.marks} Marks</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-bold">Feed Marks:</span>
                                      <input
                                        ref={(el) => { markInputRefs.current[currentInputIdx] = el; }}
                                        type="number"
                                        min={0}
                                        max={comp.marks}
                                        step={0.5}
                                        value={practicalMarksMap[comp.id] !== undefined ? practicalMarksMap[comp.id] : 0}
                                        onKeyDown={(e) => {
                                          if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const next = markInputRefs.current[currentInputIdx + 1];
                                            if (next) { next.focus(); next.select(); }
                                          }
                                        }}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                                          if (val < 0) return;
                                          handleUpdatePracticalCompMark(comp.id, Math.min(val, comp.marks), comp.marks);
                                        }}
                                        className="w-20 px-2 py-1 rounded bg-[#F6F8FC] dark:bg-slate-900 border border-[#F36C21] text-[#F36C21] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#F36C21]/40"
                                      />
                                      <span className="text-[10px] text-slate-400">/ {comp.marks}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {qList.map((q, qIdx) => {
                                const qId = q.questionId || q.id || `q-${qIdx}`;
                                const subQs = q.sub_questions || q.subQuestions;
                                const maxQ = Number(q.marks || q.customMarks || q.defaultMarks || 2);
                                const hasSub = Array.isArray(subQs) && subQs.length > 0;
                                const mainInputIdx = !hasSub ? inputSeqCounter++ : -1;

                                return (
                                  <div key={qId} className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-[#E7EAF3] dark:border-slate-800 space-y-2 text-xs">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[#5B4BFF]">{qIdx + 1}.</span>
                                          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            🎯 {q.sub_topic_code || q.competency_code || q.competencyCode || q.unit_code || 'CO1'}
                                          </span>
                                          <span className="text-[10px] text-slate-400">[{q.mode}]</span>
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-white leading-snug">{q.questionText || q.question_text}</p>
                                      </div>

                                      {!hasSub && (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="text-[10px] font-bold text-slate-500">Feed Marks:</span>
                                          <input
                                            ref={(el) => { if (mainInputIdx >= 0) markInputRefs.current[mainInputIdx] = el; }}
                                            type="number"
                                            min={0}
                                            max={maxQ}
                                            step={0.5}
                                            value={questionMarksMap[qId] !== undefined ? questionMarksMap[qId] : 0}
                                            onKeyDown={(e) => {
                                              if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const next = markInputRefs.current[mainInputIdx + 1];
                                                if (next) { next.focus(); next.select(); }
                                              }
                                            }}
                                            onChange={(e) => {
                                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                                              if (val < 0) return;
                                              handleUpdateQMark(qId, Math.min(val, maxQ), maxQ);
                                            }}
                                            className="w-16 px-2 py-1 rounded bg-[#F6F8FC] dark:bg-slate-900 border border-[#5B4BFF] text-[#00C48C] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/40"
                                          />
                                          <span className="text-[10px] text-slate-500">/ {maxQ}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Sub-Parts with Composite Key Isolation (${qId}___${sq.id}) */}
                                    {hasSub && (
                                      <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pt-1">
                                        {subQs.map((sq, sqIdx) => {
                                          const subKey = `${qId}___${sq.id || sq.label || sqIdx}`;
                                          const maxSubMarks = Number(sq.marks || 2.5);
                                          const subInputIdx = inputSeqCounter++;

                                          return (
                                            <div key={subKey} className="flex items-center justify-between p-2 rounded bg-[#F6F8FC] dark:bg-slate-900/60 border border-[#E7EAF3] dark:border-slate-800">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-[#5B4BFF] text-[11px]">{sq.label})</span>
                                                <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">{sq.questionText || sq.question_text}</span>
                                              </div>

                                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <span className="text-[10px] font-bold text-slate-500">Feed Marks:</span>
                                                <input
                                                  ref={(el) => { markInputRefs.current[subInputIdx] = el; }}
                                                  type="number"
                                                  min={0}
                                                  max={maxSubMarks}
                                                  step={0.5}
                                                  value={subPartMarksMap[subKey] !== undefined ? subPartMarksMap[subKey] : 0}
                                                  onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      const next = markInputRefs.current[subInputIdx + 1];
                                                      if (next) { next.focus(); next.select(); }
                                                    }
                                                  }}
                                                  onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                    if (val < 0) return;
                                                    handleUpdateSubMark(subKey, Math.min(val, maxSubMarks), maxSubMarks);
                                                  }}
                                                  className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-950 border border-[#7867FF] text-[#7867FF] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#7867FF]/40"
                                                />
                                                <span className="text-[10px] text-slate-500">/ {maxSubMarks}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
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
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs font-bold">
                  Select a student from the left roster to view question papers &amp; feed assessment scores.
                </div>
              )}

              {/* Bottom Quick Action Bar */}
              <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Passing Threshold: <strong>{activePaper?.passing_marks || 32}.00 Marks (40%)</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSaveStudentEvaluation}
                  disabled={saving || !selectedStudent}
                  className="px-6 py-2.5 bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-black rounded-xl text-xs shadow-md shadow-[#5B4BFF]/20 transition flex items-center gap-2"
                >
                  {saving ? 'Saving...' : '💾 Save & Update Score'}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: CBME COMPETENCY PERFORMANCE MATRIX & BATCH SUMMARY */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {selectedPaperCode && activePaper && filteredStudents.length > 0 && (
            <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                    STEP 4: CBME COMPETENCY MATRIX &amp; BATCH PERFORMANCE LEDGER
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Live evaluated marks aggregated across question competencies.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    🖨️ Print Matrix Report
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-[#F6F8FC] dark:bg-slate-900/50">
                      <th className="py-3 px-3 rounded-l-xl">Roll No</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3 text-center">🎯 CO1 (Web Tech / Python)</th>
                      <th className="py-3 px-3 text-center">🎯 PYTH1.1</th>
                      <th className="py-3 px-3 text-center">Total Marks</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredStudents.map((st) => (
                      <tr key={st.rollno || st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#5B4BFF]">{st.rollno}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            !st.evaluated ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {st.evaluated ? `${st.competencyScores['CO1']?.scored || 18} / 20` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            !st.evaluated ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {st.evaluated ? `${st.competencyScores['PYTH1.1']?.scored || 19} / 20` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                          {st.evaluated ? `${Math.max(0, st.marks_obtained).toFixed(2)} / ${st.max_marks}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            !st.evaluated
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                              : st.is_pass
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          }`}>
                            {!st.evaluated ? 'Pending' : st.is_pass ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectStudent(st.rollno)}
                            className="px-3 py-1 bg-[#5B4BFF]/10 hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white font-bold rounded-lg text-[11px] transition"
                          >
                            Evaluate →
                          </button>
                        </td>
                      </tr>
                    ))}
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
