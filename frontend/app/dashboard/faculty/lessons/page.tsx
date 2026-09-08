'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface DropdownItem {
  id: string;
  code: string;
  name: string;
  [key: string]: any;
}

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

  // Curriculum Hierarchy Selectors (Master Data from Backend)
  const [rawUnits, setRawUnits] = useState<any[]>([]);
  const [rawTopics, setRawTopics] = useState<any[]>([]);
  const [rawSubtopics, setRawSubtopics] = useState<any[]>([]);

  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

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
    if (crs === '13') return [{ code: '1', name: 'BCA General' }];
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

  // 1. Available Units filtered by Academic Scoping (Colg, Course, Branch, Batch, Sem)
  const availableUnits = useMemo(() => {
    if (!rawUnits || rawUnits.length === 0) {
      return [
        { id: 'CO1', code: 'CO1', name: 'Course Outcome 1 (CO1)' },
        { id: 'CO2', code: 'CO2', name: 'Course Outcome 2 (CO2)' },
        { id: 'CO3', code: 'CO3', name: 'Course Outcome 3 (CO3)' },
        { id: 'CO4', code: 'CO4', name: 'Course Outcome 4 (CO4)' },
        { id: 'CO5', code: 'CO5', name: 'Course Outcome 5 (CO5)' },
      ];
    }

    const filtered = rawUnits.filter((u: any) => {
      const matchCrs = !selectedCourse || !u.course_cd || String(u.course_cd) === String(selectedCourse);
      const matchBr = !selectedBranch || !u.branch_cd || String(u.branch_cd) === String(selectedBranch);
      const matchSem = !selectedSem || !u.sem_cd || String(u.sem_cd) === String(selectedSem);
      return matchCrs && matchBr && matchSem;
    });

    const listToUse = filtered.length > 0 ? filtered : rawUnits;
    return listToUse.map((u: any) => ({
      id: String(u.id || u.code),
      code: String(u.code || u.unit_code || u.id || 'CO1'),
      name: u.name || u.unit_name || `Unit ${u.code || u.id}`,
    }));
  }, [rawUnits, selectedCourse, selectedBranch, selectedBatch, selectedSem]);

  // 2. Available Topics filtered by Selected Unit
  const availableTopics = useMemo(() => {
    if (!selectedUnit) return [];

    const filtered = rawTopics.filter((t: any) => {
      const uId = String(selectedUnit).toLowerCase();
      return (
        String(t.unit_id || '').toLowerCase() === uId ||
        String(t.unit_code || '').toLowerCase() === uId ||
        String(t.unit_name || '').toLowerCase() === uId ||
        String(t.code || '').toLowerCase().startsWith(uId)
      );
    });

    const listToUse = filtered.length > 0 ? filtered : rawTopics;
    return listToUse.map((t: any) => ({
      id: String(t.id || t.code),
      code: String(t.code || t.topic_code || t.id),
      name: t.name || t.topic_name || `Topic ${t.code || t.id}`,
    }));
  }, [rawTopics, selectedUnit]);

  // 3. Available Subtopics filtered by Selected Topic
  const availableSubtopics = useMemo(() => {
    if (!selectedTopic) return [];

    const filtered = rawSubtopics.filter((st: any) => {
      const tId = String(selectedTopic).toLowerCase();
      const uId = String(selectedUnit).toLowerCase();
      return (
        String(st.topic_id || '').toLowerCase() === tId ||
        String(st.topic_code || '').toLowerCase() === tId ||
        String(st.unit_id || '').toLowerCase() === uId ||
        String(st.code || '').toLowerCase().includes(tId)
      );
    });

    const listToUse = filtered.length > 0 ? filtered : rawSubtopics;
    return listToUse.map((st: any) => ({
      id: String(st.id || st.code),
      code: String(st.code || st.id),
      name: st.description || st.name || st.code,
    }));
  }, [rawSubtopics, selectedTopic, selectedUnit]);

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

    setSelectedBranch(defaultBranch);
    setSelectedBatch(defaultBatch);
    setSelectedSem((prev) => (sems.some((s) => s.code === prev) ? prev : sems[0]?.code || '1'));
  };

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

        setSelectedBranch(defaultBranch);
        setSelectedBatch(defaultBatch);
        setSelectedSem(sems[0]?.code || '1');

        fetchCurriculumHierarchy();
      } catch (err) {
        console.warn('Error loading academic metadata:', err);
      }
    };

    initAcademicMetadata();
    fetchLessons();
  }, []);

  const fetchCurriculumHierarchy = async () => {
    try {
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [unitRes, topRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/units?tenant=${tenant}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${tenant}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${tenant}`, { headers }).catch(() => null),
      ]);

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
    } catch (err) {
      console.warn('Error fetching curriculum hierarchy:', err);
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons?tenant=${tenant}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('colgCd', colgCd);
      formData.append('courseCd', selectedCourse);
      formData.append('branchCd', selectedBranch);
      formData.append('batchCd', selectedBatch);
      formData.append('semCd', selectedSem);
      formData.append('unitId', selectedUnit);
      formData.append('topicId', selectedTopic);
      formData.append('subtopicId', selectedSubtopic);
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/lessons?tenant=${tenant}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson study material uploaded successfully!' });
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        fetchLessons();
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
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons/${id}?tenant=${tenant}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson deleted successfully.' });
        fetchLessons();
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
      return { icon: '📄', label: 'PDF', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30' };
    }
    if (typeStr.includes('doc') || typeStr.includes('word')) {
      return { icon: '📝', label: 'DOC', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' };
    }
    if (typeStr.includes('xls') || typeStr.includes('excel') || typeStr.includes('sheet')) {
      return { icon: '📊', label: 'XLS', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' };
    }
    if (typeStr.includes('jpg') || typeStr.includes('jpeg') || typeStr.includes('png') || typeStr.includes('img') || typeStr.includes('image')) {
      return { icon: '🖼️', label: 'IMG', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' };
    }
    if (typeStr.includes('txt')) {
      return { icon: '📑', label: 'TXT', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30' };
    }
    return { icon: '📎', label: (fileType || 'FILE').toUpperCase(), bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' };
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
                <span>Step 1: Academic & Semester Scoping</span>
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
                  3. Branch * <span className="text-[#5B4BFF]">({branchesList.length})</span>
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
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#5B4BFF] dark:text-indigo-300 focus:outline-none focus:border-[#5B4BFF]"
                >
                  {semestersList.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Step 2: Curriculum Hierarchy Selectors (Unit ➔ Topic ➔ Sub-Topic) */}
            <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-[#F36C21] tracking-wider flex items-center gap-2">
                <span>📖</span>
                <span>Step 2: Curriculum Topic Mapping</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value);
                      setSelectedTopic('');
                      setSelectedSubtopic('');
                    }}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  >
                    <option value="">-- Select Curriculum Unit / CO --</option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.code}>
                        [{u.code}] {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setSelectedSubtopic('');
                    }}
                    disabled={!selectedUnit}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-60"
                  >
                    <option value="">-- Select Teaching Topic --</option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.code}>
                        [{t.code}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Topic / Competency</label>
                  <select
                    value={selectedSubtopic}
                    onChange={(e) => setSelectedSubtopic(e.target.value)}
                    disabled={!selectedTopic}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-60"
                  >
                    <option value="">-- Select Sub-Topic --</option>
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
                <span>📤</span>
                <span>Step 3: Upload Lesson File (Max 25MB)</span>
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
                  <p className="text-[11px] text-[#5B4BFF] font-semibold mt-1">
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
                className="px-6 py-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
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
                <span>Uploaded Lessons Library</span>
              </h3>
              <button
                type="button"
                onClick={fetchLessons}
                className="text-xs font-bold text-[#5B4BFF] dark:text-indigo-400 hover:underline"
              >
                🔄 Refresh
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
                      <th className="p-3 font-extrabold">Lesson Title</th>
                      <th className="p-3 font-extrabold">Academic Scope</th>
                      <th className="p-3 font-extrabold">File & Size</th>
                      <th className="p-3 font-extrabold">Faculty / Date</th>
                      <th className="p-3 font-extrabold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                    {lessons.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F6F8FC]/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-extrabold text-[#1B1E28] dark:text-white text-xs">{item.title}</p>
                          {item.topic_id && <p className="text-[11px] text-[#5B4BFF] font-semibold">📖 {item.topic_id}</p>}
                        </td>
                        <td className="p-3 font-mono font-bold text-[11px] text-[#7B8794]">
                          Crs:{item.course_cd} • Br:{item.branch_cd} • {item.sem_cd}
                        </td>
                        <td className="p-3">
                          {(() => {
                            const meta = getFileMeta(item.file_type, item.file_name);
                            return (
                              <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-[10px] inline-flex items-center gap-1.5 shadow-2xs ${meta.bg}`}>
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                                <span className="opacity-70 font-semibold">({formatBytes(item.file_size)})</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-[#7B8794]">
                          <p className="font-bold text-[#1B1E28] dark:text-slate-200">{item.faculty_name || item.empid}</p>
                          <p className="text-[10px]">{new Date(item.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => window.open(`${API_BASE}/lessons/${item.id}/download?tenant=${localStorage.getItem('tenantSlug') || 'srms-cet-bareilly'}`, '_blank')}
                            className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white font-bold text-[11px] shadow-sm transition"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 font-bold text-[11px] transition"
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
