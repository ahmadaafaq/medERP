'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface AcademicCourse {
  code: string;
  name: string;
}

interface AcademicBranch {
  code: string;
  name: string;
}

interface AcademicBatch {
  code: string;
  name: string;
  year?: number;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  colg_cd: string;
  course_cd: string;
  branch_cd: string;
  batch_cd: string;
  sem_cd: string;
  subject_id?: string;
  unit_id?: string;
  topic_id?: string;
  subtopic_id?: string;
  empid: string;
  faculty_name?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function FacultyLessonsPage() {
  const [colgCd, setColgCd] = useState<string>('1');
  const [colgName, setColgName] = useState<string>('SRMS College of Engineering & Technology (CET Bareilly)');

  // Academic Cascading Selectors
  const [coursesList, setCoursesList] = useState<AcademicCourse[]>([]);
  const [branchesList, setBranchesList] = useState<AcademicBranch[]>([]);
  const [batchesList, setBatchesList] = useState<AcademicBatch[]>([]);
  const [semestersList, setSemestersList] = useState<{ code: string; label: string }[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>('13'); // Default BCA
  const [selectedBranch, setSelectedBranch] = useState<string>('1');
  const [selectedBatch, setSelectedBatch] = useState<string>('2');
  const [selectedSem, setSelectedSem] = useState<string>('1');

  // Curriculum Hierarchy Selectors (Master Data from Backend & Live Portal)
  const [rawSubjects, setRawSubjects] = useState<any[]>([]);
  const [rawUnits, setRawUnits] = useState<any[]>([]);
  const [rawTopics, setRawTopics] = useState<any[]>([]);
  const [rawSubtopics, setRawSubtopics] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Lessons List & UI State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getColgCd = () => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  };

  const getColgName = () => {
    if (typeof window === 'undefined') return 'SRMS College of Engineering & Technology (CET Bareilly)';
    const savedName =
      localStorage.getItem('college_name') ||
      localStorage.getItem('colg_name') ||
      localStorage.getItem('tenantName');
    if (savedName) return savedName;
    const slug = getTenantSlug();
    if (slug.includes('cetr')) return 'SRMS College of Engineering, Technology & Research (CETR Bareilly)';
    if (slug.includes('cet-lucknow') || slug.includes('cetl')) return 'SRMS College of Engineering & Technology (CET Lucknow)';
    if (slug.includes('pharm')) return 'SRMS College of Pharmacy (Bareilly)';
    if (slug.includes('ibs')) return 'SRMS Institute of Business Studies (IBS Lucknow)';
    if (slug.includes('ims')) return 'SRMS Institute of Medical Sciences (IMS Bareilly)';
    return 'SRMS College of Engineering & Technology (CET Bareilly)';
  };

  const getFacultyUser = () => {
    if (typeof window === 'undefined') return { name: 'VINAY KUMAR', empid: '202616658' };
    try {
      const cached = localStorage.getItem('user');
      if (cached) {
        const u = JSON.parse(cached);
        const p = u.profile || {};
        const name = p.name || u.name || p.faculty_name || u.faculty_name || localStorage.getItem('faculty_name') || localStorage.getItem('userName') || localStorage.getItem('name') || 'VINAY KUMAR';
        const empid = p.emp_id || p.empId || u.emp_id || u.empId || u.sub || localStorage.getItem('empid') || localStorage.getItem('emp_id') || '202616658';
        return { name: (name && name !== 'undefined' && name !== 'null') ? name : 'VINAY KUMAR', empid };
      }
    } catch {}
    const name = localStorage.getItem('faculty_name') || localStorage.getItem('userName') || localStorage.getItem('name') || 'VINAY KUMAR';
    const empid = localStorage.getItem('empid') || localStorage.getItem('emp_id') || '202616658';
    return { name: (name && name !== 'undefined' && name !== 'null') ? name : 'VINAY KUMAR', empid };
  };

  const formatAcademicScope = (item: Lesson) => {
    // 1. Course Name
    const courseMatch = coursesList.find((c) => String(c.code) === String(item.course_cd));
    let courseName = courseMatch?.name;
    if (!courseName) {
      if (item.course_cd === '13') courseName = 'BCA';
      else if (item.course_cd === '1') courseName = 'B.Tech';
      else if (item.course_cd === '2') courseName = 'B.Pharm';
      else if (item.course_cd === '3') courseName = 'MCA';
      else if (item.course_cd === '4') courseName = 'MBA';
      else courseName = `Course #${item.course_cd}`;
    }

    // 2. Branch Name (Format short code in parentheses like BCA • (CSE))
    const branchMatch = branchesList.find((b) => String(b.code) === String(item.branch_cd));
    let branchName = branchMatch?.name;
    if (!branchName) {
      if (item.course_cd === '13') branchName = '(CSE)';
      else if (item.course_cd === '3') branchName = '(MCA)';
      else if (item.course_cd === '2') branchName = '(Pharmacy)';
      else if (item.course_cd === '4') branchName = '(MBA)';
      else if (item.branch_cd === '1') branchName = '(CSE)';
      else if (item.branch_cd === '2') branchName = '(IT)';
      else if (item.branch_cd === '3') branchName = '(ME)';
      else if (item.branch_cd === '4') branchName = '(EE)';
      else if (item.branch_cd === '5') branchName = '(EC)';
      else branchName = `(Branch #${item.branch_cd})`;
    } else {
      const matchParen = branchName.match(/\(([^)]+)\)/);
      if (matchParen) {
        branchName = `(${matchParen[1]})`;
      } else if (!branchName.startsWith('(')) {
        branchName = `(${branchName})`;
      }
    }

    // 3. Batch Name
    const batchMatch = batchesList.find((b) => String(b.code) === String(item.batch_cd));
    let batchName = batchMatch?.name;
    if (!batchName) {
      if (item.batch_cd === '2' || item.batch_cd === '18') batchName = '2025';
      else if (item.batch_cd === '15' || item.batch_cd === '17') batchName = '2024';
      else if (item.batch_cd === '1' || item.batch_cd === '19' || item.batch_cd === '3') batchName = '2026';
      else batchName = item.batch_cd;
    }

    // 4. Sem Name
    const semClean = String(item.sem_cd || '').replace(/\D/g, '');
    const semLabel = semClean ? `Sem ${semClean}` : (item.sem_cd || 'Sem 1');

    return {
      primary: `${courseName} • ${branchName}`,
      secondary: `Batch ${batchName} • ${semLabel}`,
    };
  };

  const fetchCourses = async (cd: string, slug: string): Promise<AcademicCourse[]> => {
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c: any) => ({
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
          }));
        }
      }
    } catch {}
    return [
      { code: '13', name: 'BCA' },
      { code: '1', name: 'B.Tech' },
      { code: '3', name: 'MCA' },
      { code: '2', name: 'B.Pharm' },
      { code: '4', name: 'MBA' },
    ];
  };

  const fetchBranches = async (cd: string, crs: string, slug: string, allCourses: AcademicCourse[]): Promise<AcademicBranch[]> => {
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = allCourses.find((c) => String(c.code) === String(crs));
          const courseName = courseObj?.name || 'BCA';
          return list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName =
              rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
                ? rawName
                : `${b.course_name || courseName} General`;
            return {
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
            };
          });
        }
      }
    } catch {}
    if (crs === '13') return [{ code: '1', name: 'Computer Science & Engineering (CSE)' }];
    if (crs === '1') {
      return [
        { code: '1', name: 'Computer Science & Engineering (CSE)' },
        { code: '2', name: 'Information Technology (IT)' },
        { code: '3', name: 'Electronics & Communication (ECE)' },
        { code: '4', name: 'Mechanical Engineering (ME)' },
      ];
    }
    if (crs === '3') return [{ code: '1', name: 'MCA Core' }];
    if (crs === '2') return [{ code: '1', name: 'B.Pharm Core' }];
    if (crs === '4') return [{ code: '1', name: 'MBA Core' }];
    return [{ code: '1', name: 'General Branch' }];
  };

  const fetchBatches = async (cd: string, crs: string, slug: string): Promise<AcademicBatch[]> => {
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
          }));
        }
      }
    } catch {}
    if (crs === '13') {
      return [
        { code: '3', name: '2026', year: 2026 },
        { code: '2', name: '2025', year: 2025 },
        { code: '1', name: '2024', year: 2024 },
      ];
    }
    if (crs === '1') {
      return [
        { code: '19', name: '2026', year: 2026 },
        { code: '18', name: '2025', year: 2025 },
        { code: '17', name: '2024', year: 2024 },
      ];
    }
    return [
      { code: '1', name: '2025', year: 2025 },
      { code: '2', name: '2024', year: 2024 },
    ];
  };

  const getSemestersForCourse = (courseCd: string, courseName?: string) => {
    const cName = (courseName || '').toLowerCase();
    let maxSem = 6;
    if (courseCd === '1' || courseCd === '2' || cName.includes('b.tech') || cName.includes('b.pharm')) {
      maxSem = 8;
    } else if (courseCd === '13' || cName.includes('bca')) {
      maxSem = 6;
    } else if (courseCd === '3' || courseCd === '4' || courseCd === '5' || courseCd === '21' || cName.includes('mca') || cName.includes('mba') || cName.includes('m.tech') || cName.includes('m.pharm')) {
      maxSem = 4;
    } else if (courseCd === '24' || cName.includes('pharm.d')) {
      maxSem = 10;
    } else {
      maxSem = 8;
    }

    const sems: { code: string; label: string }[] = [];
    for (let i = 1; i <= maxSem; i++) {
      const year = Math.ceil(i / 2);
      sems.push({ code: String(i), label: `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Semester (Year ${year})` });
    }
    return sems;
  };

  // 1. Available Subjects from Curriculum Subject Master List
  const availableSubjects = useMemo(() => {
    if (!rawSubjects || rawSubjects.length === 0) return [];

    // Filter by selectedCourse and selectedSem if matched
    const filtered = rawSubjects.filter((s: any) => {
      const matchCourse = !selectedCourse || !s.course_cd || String(s.course_cd) === String(selectedCourse);
      const matchSem = !selectedSem || !s.sem_cd || String(s.sem_cd) === String(selectedSem) || String(s.semester) === String(selectedSem);
      return matchCourse && matchSem;
    });

    if (filtered.length > 0) {
      return filtered.map((s: any) => ({
        id: String(s.id || s.code || s.sub_cd),
        code: String(s.code || s.sub_cd || s.id),
        name: s.name || s.sub_name || s.mst_sub_name || `Subject #${s.code || s.id}`,
        sem_cd: s.sem_cd || s.semester,
      }));
    }

    // Fallback: match by course only
    const courseFiltered = rawSubjects.filter((s: any) => {
      return !selectedCourse || !s.course_cd || String(s.course_cd) === String(selectedCourse);
    });

    const listToUse = courseFiltered.length > 0 ? courseFiltered : rawSubjects;
    return listToUse.map((s: any) => ({
      id: String(s.id || s.code || s.sub_cd),
      code: String(s.code || s.sub_cd || s.id),
      name: s.name || s.sub_name || s.mst_sub_name || `Subject #${s.code || s.id}`,
      sem_cd: s.sem_cd || s.semester,
    }));
  }, [rawSubjects, selectedCourse, selectedSem]);

  // 2. Available Units filtered dynamically based on Selected Subject
  const availableUnits = useMemo(() => {
    if (!selectedSubject) return [];

    const subjObj = rawSubjects.find(
      (s: any) => String(s.code).toLowerCase() === String(selectedSubject).toLowerCase() ||
                  String(s.id).toLowerCase() === String(selectedSubject).toLowerCase()
    );

    const subCode = (subjObj?.code || selectedSubject || '').toLowerCase();
    const subId = (subjObj?.id || '').toLowerCase();

    const filtered = rawUnits.filter((u: any) => {
      const uSubId = String(u.subject_id || '').toLowerCase();
      const uSubCode = String(u.subject_code || '').toLowerCase();
      return (
        (subId && uSubId === subId) ||
        (subCode && (uSubCode === subCode || uSubId === subCode)) ||
        (subCode && u.code && String(u.code).toLowerCase().includes(subCode))
      );
    });

    if (filtered.length > 0) {
      return filtered.map((u: any) => ({
        id: String(u.id || u.code),
        code: String(u.code || u.unit_code || u.id),
        name: u.name || u.unit_name || `Unit ${u.code || u.id}`,
      }));
    }

    // Standard Course Outcome units fallback (CO1 to CO5) so teacher is never blocked
    return [
      { id: 'CO1', code: 'CO1', name: 'Course Outcome 1 (CO1)' },
      { id: 'CO2', code: 'CO2', name: 'Course Outcome 2 (CO2)' },
      { id: 'CO3', code: 'CO3', name: 'Course Outcome 3 (CO3)' },
      { id: 'CO4', code: 'CO4', name: 'Course Outcome 4 (CO4)' },
      { id: 'CO5', code: 'CO5', name: 'Course Outcome 5 (CO5)' },
    ];
  }, [rawUnits, selectedSubject, rawSubjects]);

  // 3. Available Topics filtered by Selected Unit & Subject
  const availableTopics = useMemo(() => {
    if (!selectedUnit) return [];

    const subjObj = rawSubjects.find(
      (s: any) => String(s.code).toLowerCase() === String(selectedSubject).toLowerCase() ||
                  String(s.id).toLowerCase() === String(selectedSubject).toLowerCase()
    );
    const subCode = (subjObj?.code || selectedSubject || '').toLowerCase();
    const subId = (subjObj?.id || '').toLowerCase();
    const uId = String(selectedUnit).toLowerCase();

    const filtered = rawTopics.filter((t: any) => {
      const matchUnit = (
        String(t.unit_id || '').toLowerCase() === uId ||
        String(t.unit_code || '').toLowerCase() === uId ||
        String(t.unit_name || '').toLowerCase() === uId ||
        String(t.code || '').toLowerCase().includes(uId)
      );

      const matchSubject = !selectedSubject || (
        (subId && String(t.subject_id || '').toLowerCase() === subId) ||
        (subCode && (String(t.subject_code || '').toLowerCase() === subCode || String(t.code || '').toLowerCase().includes(subCode)))
      );

      return matchUnit && matchSubject;
    });

    if (filtered.length > 0) {
      return filtered.map((t: any) => ({
        id: String(t.id || t.code),
        code: String(t.code || t.topic_code || t.id),
        name: t.name || t.topic_name || `Topic ${t.code || t.id}`,
      }));
    }

    const prefix = subCode ? `${subCode.toUpperCase()}-${selectedUnit}` : selectedUnit;
    return [
      { id: `${prefix}-T01`, code: `${prefix}-T01`, name: `${prefix}-T01: Introduction & Fundamental Principles` },
      { id: `${prefix}-T02`, code: `${prefix}-T02`, name: `${prefix}-T02: In-Depth Conceptual Architecture & Theory` },
      { id: `${prefix}-T03`, code: `${prefix}-T03`, name: `${prefix}-T03: Practical Implementation & Problem Solving` },
    ];
  }, [rawTopics, selectedUnit, selectedSubject, rawSubjects]);

  // 4. Available Subtopics / Competencies filtered by Selected Topic
  const availableSubtopics = useMemo(() => {
    if (!selectedTopic) return [];

    const tId = String(selectedTopic).toLowerCase();
    const uId = String(selectedUnit).toLowerCase();

    const filtered = rawSubtopics.filter((st: any) => {
      return (
        String(st.topic_id || '').toLowerCase() === tId ||
        String(st.topic_code || '').toLowerCase() === tId ||
        String(st.code || '').toLowerCase().includes(tId) ||
        (String(st.unit_id || '').toLowerCase() === uId && !st.topic_id)
      );
    });

    if (filtered.length > 0) {
      return filtered.map((st: any) => ({
        id: String(st.id || st.code),
        code: String(st.code || st.id),
        name: st.description || st.name || st.code,
      }));
    }

    return [
      { id: `${selectedTopic}-C01`, code: `${selectedTopic}-C01`, name: `Core Competency 1: Conceptual Knowledge & Theory` },
      { id: `${selectedTopic}-C02`, code: `${selectedTopic}-C02`, name: `Core Competency 2: Application & Problem Solving` },
      { id: `${selectedTopic}-C03`, code: `${selectedTopic}-C03`, name: `Core Competency 3: Practical Demonstration & Viva` },
    ];
  }, [rawSubtopics, selectedTopic, selectedUnit]);

  // Dynamic Lessons Fetching Scoped to Selection
  const fetchLessons = async (
    crs = selectedCourse,
    br = selectedBranch,
    bat = selectedBatch,
    sem = selectedSem,
    sub = selectedSubject,
  ) => {
    try {
      setLoading(true);
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const queryParams = new URLSearchParams({ tenant });
      if (crs) queryParams.append('courseCd', crs);
      if (br) queryParams.append('branchCd', br);
      if (bat) queryParams.append('batchCd', bat);
      if (sem) queryParams.append('semCd', sem);
      if (sub) queryParams.append('subjectId', sub);

      const res = await fetch(`${API_BASE}/lessons?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setLessons(json.data || []);
      }
    } catch (err) {
      console.warn('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumHierarchy = async (
    courseCd = selectedCourse,
    branchCd = selectedBranch,
    batchCd = selectedBatch,
    semCd = selectedSem,
  ) => {
    try {
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [subjRes, unitRes, topRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/subjects?tenant=${tenant}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/units?tenant=${tenant}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${tenant}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${tenant}`, { headers }).catch(() => null),
      ]);

      let backendSubjects: any[] = [];
      if (subjRes && subjRes.ok) {
        const j = await subjRes.json();
        backendSubjects = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
      }
      if (unitRes && unitRes.ok) {
        const j = await unitRes.json();
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        setRawUnits(list);
      }
      if (topRes && topRes.ok) {
        const j = await topRes.json();
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        setRawTopics(list);
      }
      if (compRes && compRes.ok) {
        const j = await compRes.json();
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        setRawSubtopics(list);
      }

      // Fetch live portal subjects for selected academic scope as well
      const cd = getColgCd();
      let liveSubjects: any[] = [];
      try {
        const liveRes = await fetch(`/api/srms/all-subjects?colgcd=${cd}&coursecd=${courseCd}&branchcd=${branchCd}&batchcd=${batchCd}&semcd=${semCd}&tenant=${tenant}`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (Array.isArray(liveData)) {
            liveSubjects = liveData.map((s: any) => ({
              id: String(s.sub_cd || s.code || s.id),
              code: String(s.sub_cd || s.code || s.id),
              name: s.sub_name || s.name,
              course_cd: String(courseCd),
              branch_cd: String(branchCd),
              batch_cd: String(batchCd),
              sem_cd: String(semCd),
              mst_sub_name: s.mst_sub_name,
            }));
          }
        }
      } catch (err) {
        console.warn('Live SRMS portal subjects fetch error:', err);
      }

      // Merge backend subjects and live portal subjects (deduplicating by code)
      const mergedMap = new Map<string, any>();
      backendSubjects.forEach((s: any) => {
        const key = String(s.code || s.id).trim().toUpperCase();
        mergedMap.set(key, s);
      });
      liveSubjects.forEach((s: any) => {
        const key = String(s.code || s.id).trim().toUpperCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, s);
        }
      });

      setRawSubjects(Array.from(mergedMap.values()));
    } catch (err) {
      console.warn('Error fetching curriculum hierarchy:', err);
    }
  };

  const handleCourseChange = async (newCourseCd: string) => {
    setSelectedCourse(newCourseCd);
    const cd = getColgCd();
    const slug = getTenantSlug();

    const selectedCourseObj = coursesList.find((c) => String(c.code) === String(newCourseCd));
    const [branches, batches] = await Promise.all([
      fetchBranches(cd, newCourseCd, slug, coursesList),
      fetchBatches(cd, newCourseCd, slug),
    ]);

    setBranchesList(branches);
    setBatchesList(batches);

    const sems = getSemestersForCourse(newCourseCd, selectedCourseObj?.name);
    setSemestersList(sems);

    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch = batches.find((b) => b.name === '2025' || b.name === '2026' || b.year === 2025 || b.year === 2026)?.code || batches[0]?.code || '1';
    const defaultSem = sems[0]?.code || '1';

    setSelectedBranch(defaultBranch);
    setSelectedBatch(defaultBatch);
    setSelectedSem(defaultSem);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');

    fetchLessons(newCourseCd, defaultBranch, defaultBatch, defaultSem, '');
    fetchCurriculumHierarchy(newCourseCd, defaultBranch, defaultBatch, defaultSem);
  };

  // Initial Data Load
  useEffect(() => {
    const cd = getColgCd();
    const name = getColgName();
    const slug = getTenantSlug();

    setColgCd(cd);
    setColgName(name);

    const initAcademicMetadata = async () => {
      try {
        const courses = await fetchCourses(cd, slug);
        setCoursesList(courses);

        const defaultCourse = courses.find((c) => c.code === '13' || c.name.toLowerCase().includes('bca')) || courses[0];
        const initialCourseCd = defaultCourse ? defaultCourse.code : '13';
        setSelectedCourse(initialCourseCd);

        const [branches, batches] = await Promise.all([
          fetchBranches(cd, initialCourseCd, slug, courses),
          fetchBatches(cd, initialCourseCd, slug),
        ]);

        setBranchesList(branches);
        setBatchesList(batches);

        const sems = getSemestersForCourse(initialCourseCd, defaultCourse?.name);
        setSemestersList(sems);

        const defaultBranch = branches[0]?.code || '1';
        const defaultBatch = batches.find((b) => b.name === '2025' || b.name === '2026' || b.year === 2025 || b.year === 2026)?.code || batches[0]?.code || '1';
        const defaultSem = sems.some((s) => s.code === '3') ? '3' : (sems[0]?.code || '1');

        setSelectedBranch(defaultBranch);
        setSelectedBatch(defaultBatch);
        setSelectedSem(defaultSem);

        fetchCurriculumHierarchy(initialCourseCd, defaultBranch, defaultBatch, defaultSem);
        fetchLessons(initialCourseCd, defaultBranch, defaultBatch, defaultSem, '');
      } catch (err) {
        console.warn('Error loading academic metadata:', err);
      }
    };

    initAcademicMetadata();
  }, []);

  // Dynamic Reload when Course, Branch, Batch, Semester or Subject changes
  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject);
    }
  }, [selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const max25MB = 25 * 1024 * 1024;
      if (file.size > max25MB) {
        setAlert({ type: 'error', message: 'Selected file exceeds the 25MB maximum limit. Please choose a smaller file.' });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setAlert(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setAlert({ type: 'error', message: 'Please enter a lesson title.' });
      return;
    }
    if (!selectedFile) {
      setAlert({ type: 'error', message: 'Please select a document or study material file to upload.' });
      return;
    }

    try {
      setUploading(true);
      setAlert(null);

      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const facultyUser = getFacultyUser();

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('colgCd', colgCd);
      formData.append('courseCd', selectedCourse);
      formData.append('branchCd', selectedBranch);
      formData.append('batchCd', selectedBatch);
      formData.append('semCd', selectedSem);
      if (selectedSubject) {
        formData.append('subjectId', selectedSubject);
      }
      formData.append('unitId', selectedUnit);
      formData.append('topicId', selectedTopic);
      formData.append('subtopicId', selectedSubtopic);
      formData.append('facultyName', facultyUser.name);
      formData.append('empid', facultyUser.empid);
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/lessons?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-name': facultyUser.name,
          'x-user-id': facultyUser.empid,
          'x-user-role': 'FACULTY',
        },
        body: formData,
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson study material uploaded successfully!' });
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject);
      } else {
        const json = await res.json();
        setAlert({ type: 'error', message: json.message || 'Failed to upload lesson material.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error while uploading lesson file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson material?')) return;
    try {
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons/${id}?tenant=${tenant}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson deleted successfully.' });
        fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete lesson.' });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileMeta = (fileType?: string, fileName?: string) => {
    const typeStr = `${fileType || ''} ${fileName || ''}`.toLowerCase();
    if (typeStr.includes('pdf')) {
      return { icon: '📄', label: 'PDF', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800' };
    }
    if (typeStr.includes('doc') || typeStr.includes('word')) {
      return { icon: '📝', label: 'DOC', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-200 dark:border-blue-800' };
    }
    if (typeStr.includes('xls') || typeStr.includes('excel') || typeStr.includes('sheet')) {
      return { icon: '📊', label: 'XLS', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800' };
    }
    if (typeStr.includes('jpg') || typeStr.includes('jpeg') || typeStr.includes('png') || typeStr.includes('image')) {
      return { icon: '🖼️', label: 'IMG', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200 dark:border-purple-800' };
    }
    if (typeStr.includes('txt')) {
      return { icon: '📑', label: 'TXT', bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700' };
    }
    return { icon: '📎', label: (fileType || 'FILE').toUpperCase(), bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800' };
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Lesson & Study Material Upload" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Step 1 & 2: Cascading Selectors */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-5">
            <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>🎓</span>
                <span>STEP 1: ACADEMIC & SEMESTER SCOPING</span>
              </h3>
              <p className="text-xs text-[#7B8794] mt-0.5 font-medium">
                Select target Academic Hierarchy (College, Course, Branch, Batch, Semester).
              </p>
            </div>

            {/* 5-Level Academic Cascading Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">

              {/* 1. College (Locked to Active Tenant) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">1. College</label>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800">
                    🔒 Active Tenant
                  </span>
                </div>
                <select
                  value={colgCd}
                  disabled
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-not-allowed opacity-90 text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <option value={colgCd}>[{colgCd}] {colgName}</option>
                </select>
              </div>

              {/* 2. Course */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">2. Course *</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {coursesList.map((crs) => (
                    <option key={crs.code} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Branch * <span className="text-[#F36C21]">({branchesList.length})</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {branchesList.map((br) => (
                    <option key={br.code} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">4. Batch *</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {batchesList.map((bt) => (
                    <option key={bt.code} value={bt.code}>
                      [#{bt.code}] {bt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">5. Semester *</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#F36C21] dark:text-orange-400 focus:outline-none focus:border-[#F36C21]"
                >
                  {semestersList.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Step 2: Curriculum Hierarchy Selectors (Subject ➔ Unit ➔ Topic ➔ Sub-Topic) */}
            <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-[#F36C21] tracking-wider flex items-center gap-2">
                <span>📖</span>
                <span>STEP 2: CURRICULUM TOPIC MAPPING</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                {/* 1. Subject Dropdown (Curriculum Subject Master List) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject * <span className="text-[#5B4BFF]">({availableSubjects.length})</span>
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedUnit('');
                      setSelectedTopic('');
                      setSelectedSubtopic('');
                    }}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    <option value="">-- Select Curriculum Subject --</option>
                    {availableSubjects.map((sub) => (
                      <option key={sub.id || sub.code} value={sub.code}>
                        [#{sub.code}] {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Unit Dropdown (Subject Based) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit {selectedSubject && <span className="text-[#5B4BFF]">({availableUnits.length})</span>}
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value);
                      setSelectedTopic('');
                      setSelectedSubtopic('');
                    }}
                    disabled={!selectedSubject}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedSubject ? '-- Select Curriculum Unit / CO --' : '-- Select Subject First --'}
                    </option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.code}>
                        [{u.code}] {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Topic Dropdown (Unit Based) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic {selectedUnit && <span className="text-[#5B4BFF]">({availableTopics.length})</span>}
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setSelectedSubtopic('');
                    }}
                    disabled={!selectedUnit}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedUnit ? '-- Select Teaching Topic --' : '-- Select Unit First --'}
                    </option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.code}>
                        [{t.code}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Sub-Topic / Competency Dropdown (Topic Based) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Topic / Competency {selectedTopic && <span className="text-[#5B4BFF]">({availableSubtopics.length})</span>}
                  </label>
                  <select
                    value={selectedSubtopic}
                    onChange={(e) => setSelectedSubtopic(e.target.value)}
                    disabled={!selectedTopic}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedTopic ? '-- Select Sub-Topic --' : '-- Select Topic First --'}
                    </option>
                    {availableSubtopics.map((st) => (
                      <option key={st.id} value={st.code}>
                        [{st.code}] {st.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* Step 3: File Upload & Details Form */}
          <form onSubmit={handleUploadSubmit} className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📥</span>
                <span>STEP 3: UPLOAD LESSON FILE (MAX 25MB)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 - BCNF & Relational Algebra Lecture Notes"
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Material File * (.pdf, .xls, .doc, .txt, .jpg, .png)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-bold cursor-pointer"
                  required
                />
                {selectedFile && (
                  <p className="text-[11px] text-[#F36C21] font-semibold mt-1">
                    Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">Description / Instructions</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add additional guidelines, assignment references, or reading instructions for students..."
                rows={3}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#E05A10] hover:opacity-90 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <span>{uploading ? '⏳ Uploading...' : '🚀 Upload Lesson Material'}</span>
              </button>
            </div>
          </form>

          {/* Lessons List Table */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📑</span>
                <span>UPLOADED LESSONS LIBRARY</span>
              </h3>
              <button
                type="button"
                onClick={() => fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject)}
                className="text-xs font-bold text-[#5B4BFF] hover:text-[#4335e6] dark:text-indigo-400 flex items-center gap-1 transition"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#7B8794] font-medium animate-pulse">
                Fetching uploaded lessons from PostgreSQL...
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl">
                No lessons uploaded for this selection yet. Use the form above to upload study materials.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 text-[#7B8794] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                      <th className="p-3 font-extrabold">LESSON TITLE</th>
                      <th className="p-3 font-extrabold">ACADEMIC SCOPE</th>
                      <th className="p-3 font-extrabold">FILE & SIZE</th>
                      <th className="p-3 font-extrabold">FACULTY / DATE</th>
                      <th className="p-3 font-extrabold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                    {lessons.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F6F8FC]/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-extrabold text-[#1B1E28] dark:text-white text-xs">{item.title}</p>
                          {item.topic_id && (
                            <p className="text-[11px] text-[#F36C21] font-bold flex items-center gap-1 mt-0.5">
                              <span>📖</span>
                              <span>{item.topic_id}</span>
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          {(() => {
                            const scope = formatAcademicScope(item);
                            return (
                              <div>
                                <p className="font-extrabold text-[#1B1E28] dark:text-slate-100 text-xs">
                                  {scope.primary}
                                </p>
                                <p className="text-[11px] font-bold text-[#F36C21] mt-0.5">
                                  {scope.secondary}
                                </p>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          {(() => {
                            const meta = getFileMeta(item.file_type, item.file_name);
                            return (
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 shadow-2xs ${meta.bg}`}>
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                                <span className="opacity-80 font-semibold">({formatBytes(item.file_size)})</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-[#7B8794]">
                          <p className="font-bold text-[#1B1E28] dark:text-slate-200">
                            {(() => {
                              const fn = item.faculty_name?.trim();
                              if (fn && fn !== 'Faculty Member' && fn !== 'FACULTY' && fn !== 'USER') {
                                return fn;
                              }
                              if (item.empid === '202616658') return 'VINAY KUMAR';
                              if (item.empid === '202616680' || item.empid === 'FAC001' || item.topic_id?.includes('88534')) return 'UPENDRA KUMAR';
                              if (item.empid === '202616665') return 'SUNIL SHARMA';
                              if (item.empid === '201910009') return 'JYOTIRMAY PATEL';
                              return item.faculty_name || item.empid || 'Faculty Member';
                            })()}
                          </p>
                          <p className="text-[10px] font-medium">{new Date(item.created_at || Date.now()).toLocaleDateString()}</p>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => window.open(`${API_BASE}/lessons/${item.id}/download?tenant=${getTenantSlug()}`, '_blank')}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F36C21] to-[#E05A10] hover:opacity-90 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 border border-rose-200 dark:border-rose-800 font-bold text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
