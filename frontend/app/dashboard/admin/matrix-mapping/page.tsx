'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  fetchCourses,
  fetchBranches,
  fetchBatches,
  fetchColleges,
  isSrmsTenant,
  AcademicCollege,
  AcademicCourse,
  AcademicBranch,
  AcademicBatch,
} from '@/hooks/useTenantAcademicData';
import {
  Grid,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Award,
  BookOpen,
  Filter,
  Save,
  RotateCcw,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface Subject {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  branch_cd?: string;
  sem_cd?: string;
  category?: string;
}

interface ProgramOutcome {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: string; // 'PO' | 'PSO'
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  po_order?: number;
  target_level?: number;
  is_active: boolean;
}

interface ProgramEducationalObjective {
  id: string;
  code: string;
  title: string;
  description?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  peo_order?: number;
  is_active: boolean;
}

interface Unit {
  id: string;
  code: string;
  name?: string;
  description?: string;
  subject_id?: string;
  subject_code?: string;
  bloom_level?: string;
  unit_order?: number;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/admin-master`;
const COLLEGE_API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/college-master`;

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function MatrixMappingPage() {
  const pathname = usePathname();
  const isFaculty = pathname?.includes('/dashboard/faculty');
  const role: 'admin' | 'faculty' = isFaculty ? 'faculty' : 'admin';

  // Active Tab: 1. CO - PO Mapping(Matrix) | 2. PO - PEO Mapping(Matrix)
  const [activeTab, setActiveTab] = useState<'co-po' | 'po-peo'>('co-po');

  // Filter States — All numeric codes conforming with RestrictAPI.md
  const [selectedCollege, setSelectedCollege] = useState<string>('1');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Data Collections
  const [colleges, setColleges] = useState<AcademicCollege[]>([]);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [batches, setBatches] = useState<AcademicBatch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // OBE Outcomes & Units
  const [pos, setPos] = useState<ProgramOutcome[]>([]);
  const [peos, setPeos] = useState<ProgramEducationalObjective[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Matrices: { [rowCode]: { [colCode]: number (0|1|2|3) } }
  const [coPoMatrix, setCoPoMatrix] = useState<Record<string, Record<string, number>>>({});
  const [poPeoMatrix, setPoPeoMatrix] = useState<Record<string, Record<string, number>>>({});

  // Loading & Action States
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [savingMatrix, setSavingMatrix] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Active Tenant Helper
  const getActiveTenantSlug = useCallback((): string => {
    if (selectedCollege && selectedCollege !== 'all') {
      const match = colleges.find((c) => String(c.colg_cd) === String(selectedCollege));
      if (match?.slug) return match.slug;
    }
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('tenantSlug') ||
        localStorage.getItem('selectedTenant') ||
        'srms-cet-bareilly'
      ).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    }
    return 'srms-cet-bareilly';
  }, [selectedCollege, colleges]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 1. Initial Load: Colleges -> Courses -> Branches -> Batches -> Subjects
  useEffect(() => {
    let isMounted = true;

    const initCascadingData = async () => {
      setLoading(true);
      try {
        const slug = typeof window !== 'undefined'
          ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly')
              .replace(/^tenant_/, '').replace(/^tenant-/, '').trim()
          : 'srms-cet-bareilly';

        const colgList = await fetchColleges(slug);
        if (!isMounted) return;

        let activeColgCd = '1';
        if (typeof window !== 'undefined') {
          activeColgCd = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        }
        if (colgList.length > 0 && !colgList.some((c) => String(c.colg_cd) === String(activeColgCd))) {
          activeColgCd = String(colgList[0].colg_cd || '1');
        }

        setColleges(colgList);
        setSelectedCollege(activeColgCd);

        // Fetch courses for this college
        const courseList = await fetchCourses(slug, activeColgCd);
        if (!isMounted) return;
        setCourses(courseList);

        const initialCourse = courseList.length > 0 ? courseList[0].course_cd : 'all';
        setSelectedCourse(initialCourse);

        // Fetch branches and batches for this course
        if (initialCourse !== 'all') {
          const [branchList, batchList] = await Promise.all([
            fetchBranches(slug, initialCourse, activeColgCd),
            fetchBatches(slug, initialCourse, activeColgCd),
          ]);
          if (!isMounted) return;
          setBranches(branchList);
          setBatches(batchList);

          const initialBatch = batchList.length > 0 ? String(batchList[0].year || batchList[0].batch_cd) : 'all';
          setSelectedBatch(initialBatch);

          // Load subjects for initial cascading selection
          await executeLoadSubjects(activeColgCd, initialCourse, 'all', initialBatch, 'all', 'all', slug);
        }
      } catch (err) {
        console.error('[MatrixMapping] Initial cascading load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initCascadingData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Subjects based on cascading filters
  const executeLoadSubjects = async (
    colgCd: string,
    courseCd: string,
    branchCd: string,
    batchVal: string,
    semVal: string,
    secVal: string,
    customSlug?: string
  ) => {
    setLoadingSubjects(true);
    const slug = customSlug || getActiveTenantSlug();
    try {
      let loadedSubs: Subject[] = [];

      // A. Try live SRMS timetable-subjects if SRMS tenant and course selected
      if (isSrmsTenant(slug) && courseCd !== 'all') {
        try {
          const secNum = secVal === 'all' ? 1 : Number(secVal) || 1;
          const semNum = semVal === 'all' ? 1 : Number(semVal) || 1;
          const brNum = branchCd === 'all' ? 1 : Number(branchCd) || 1;
          const batNum = batchVal === 'all' ? 2 : Number(batchVal) || 2;
          const colgNum = Number(colgCd) || 1;

          const res = await fetch(
            `/api/srms/timetable-subjects?course=${encodeURIComponent(courseCd)}&branch=${brNum}&batch=${batNum}&semester=${semNum}&section=${secNum}&colgcd=${colgNum}&tenant=${encodeURIComponent(slug)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              loadedSubs = json.data.map((item: any) => ({
                id: String(item.sub_cd || item.code || item.id),
                code: String(item.sub_cd || item.code || item.id),
                name: String(item.sub_name || item.name || item.sub_cd || 'Subject'),
                course_cd: courseCd,
                branch_cd: branchCd !== 'all' ? branchCd : undefined,
                sem_cd: semVal !== 'all' ? semVal : undefined,
              }));
            }
          }
        } catch (e) {
          console.warn('[MatrixMapping] Live timetable subjects fetch note:', e);
        }
      }

      // B. Fetch from DB (admin-master subjects)
      let dbSubs: Subject[] = [];
      try {
        const res = await fetch(`${API_BASE}/subjects?tenant=${encodeURIComponent(slug)}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          const list: any[] = json.data || json || [];
          dbSubs = list.map((s: any) => ({
            id: String(s.code || s.id),
            code: String(s.code || s.id),
            name: String(s.name || s.sub_name || s.code || 'Subject'),
            course_cd: s.course_cd ? String(s.course_cd) : undefined,
            branch_cd: s.branch_cd ? String(s.branch_cd) : undefined,
            sem_cd: s.sem_cd ? String(s.sem_cd) : undefined,
            category: s.category || s.sub_addinfo,
          }));
        }
      } catch (e) {
        console.warn('[MatrixMapping] DB subjects fetch note:', e);
      }

      // C. Filter DB subjects by the active scope
      let filteredDb = dbSubs;
      if (courseCd !== 'all') {
        filteredDb = filteredDb.filter(
          (s) => !s.course_cd || String(s.course_cd) === String(courseCd)
        );
      }
      if (branchCd !== 'all') {
        filteredDb = filteredDb.filter(
          (s) => !s.branch_cd || String(s.branch_cd) === String(branchCd)
        );
      }
      if (semVal !== 'all') {
        filteredDb = filteredDb.filter(
          (s) => !s.sem_cd || String(s.sem_cd) === String(semVal)
        );
      }

      // D. Deduplicate and merge
      const merged: Subject[] = [...loadedSubs];
      filteredDb.forEach((s) => {
        if (!merged.some((m) => m.code === s.code)) {
          merged.push(s);
        }
      });

      const finalSubjects = merged.length > 0 ? merged : (courseCd !== 'all' ? dbSubs.filter(s => !s.course_cd || String(s.course_cd) === String(courseCd)) : dbSubs);
      setSubjects(finalSubjects);

      if (finalSubjects.length > 0) {
        setSelectedSubject((prev) => {
          const found = finalSubjects.find((s) => s.code === prev || s.id === prev);
          return found ? found.code || found.id : finalSubjects[0].code || finalSubjects[0].id;
        });
      } else {
        setSelectedSubject('');
      }

      return finalSubjects;
    } catch (err) {
      console.error('[MatrixMapping] executeLoadSubjects Error:', err);
      return [];
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleManualLoadSubjects = async () => {
    const list = await executeLoadSubjects(
      selectedCollege,
      selectedCourse,
      selectedBranch,
      selectedBatch,
      selectedSemester,
      selectedSection
    );
    showToast(`Loaded ${list.length} subjects for the active curriculum cascade.`, 'info');
  };
  const loadSubjects = handleManualLoadSubjects;

  // Cascading Select Handlers
  const handleCollegeChange = async (colgCd: string) => {
    setSelectedCollege(colgCd);
    setSelectedCourse('all');
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedSemester('all');
    setSelectedSection('all');
    setSelectedSubject('');

    const match = colleges.find((c) => String(c.colg_cd) === String(colgCd));
    const slug = match?.slug || getActiveTenantSlug();

    try {
      const courseList = await fetchCourses(slug, colgCd);
      setCourses(courseList);
      const firstCourse = courseList.length > 0 ? courseList[0].course_cd : 'all';
      setSelectedCourse(firstCourse);

      if (firstCourse !== 'all') {
        const [branchList, batchList] = await Promise.all([
          fetchBranches(slug, firstCourse, colgCd),
          fetchBatches(slug, firstCourse, colgCd),
        ]);
        setBranches(branchList);
        setBatches(batchList);
        const firstBatch = batchList.length > 0 ? String(batchList[0].year || batchList[0].batch_cd) : 'all';
        setSelectedBatch(firstBatch);
        await executeLoadSubjects(colgCd, firstCourse, 'all', firstBatch, 'all', 'all', slug);
      } else {
        setBranches([]);
        setBatches([]);
        await executeLoadSubjects(colgCd, 'all', 'all', 'all', 'all', 'all', slug);
      }
    } catch (err) {
      console.error('[MatrixMapping] handleCollegeChange Error:', err);
    }
  };

  const handleCourseChange = async (courseCd: string) => {
    setSelectedCourse(courseCd);
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedSemester('all');
    setSelectedSection('all');
    setSelectedSubject('');

    const slug = getActiveTenantSlug();
    if (courseCd !== 'all') {
      try {
        const [branchList, batchList] = await Promise.all([
          fetchBranches(slug, courseCd, selectedCollege),
          fetchBatches(slug, courseCd, selectedCollege),
        ]);
        setBranches(branchList);
        setBatches(batchList);
        const firstBatch = batchList.length > 0 ? String(batchList[0].year || batchList[0].batch_cd) : 'all';
        setSelectedBatch(firstBatch);
        await executeLoadSubjects(selectedCollege, courseCd, 'all', firstBatch, 'all', 'all', slug);
      } catch (err) {
        console.error('[MatrixMapping] handleCourseChange Error:', err);
      }
    } else {
      setBranches([]);
      setBatches([]);
      await executeLoadSubjects(selectedCollege, 'all', 'all', 'all', 'all', 'all', slug);
    }
  };

  const handleBranchChange = (branchCd: string) => {
    setSelectedBranch(branchCd);
    executeLoadSubjects(selectedCollege, selectedCourse, branchCd, selectedBatch, selectedSemester, selectedSection);
  };

  const handleBatchChange = (batchVal: string) => {
    setSelectedBatch(batchVal);
    executeLoadSubjects(selectedCollege, selectedCourse, selectedBranch, batchVal, selectedSemester, selectedSection);
  };

  const handleSemesterChange = (semVal: string) => {
    setSelectedSemester(semVal);
    executeLoadSubjects(selectedCollege, selectedCourse, selectedBranch, selectedBatch, semVal, selectedSection);
  };

  const handleSectionChange = (secVal: string) => {
    setSelectedSection(secVal);
    executeLoadSubjects(selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester, secVal);
  };

  const handleSubjectChange = (subjVal: string) => {
    setSelectedSubject(subjVal);
  };

  // 3. Fetch POs & PEOs for Program
  const fetchPosAndPeos = useCallback(async () => {
    const tenant = getActiveTenantSlug();
    try {
      const q = new URLSearchParams({ tenant });
      if (selectedCourse !== 'all') q.append('courseCd', selectedCourse);
      if (selectedBranch !== 'all') q.append('branchCd', selectedBranch);

      let [posRes, peosRes] = await Promise.all([
        fetch(`${API_BASE}/pos?${q.toString()}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/peos?${q.toString()}`, { headers: getAuthHeaders() }),
      ]);

      if (!posRes.ok) {
        posRes = await fetch(`/api/v1/admin-master/pos?${q.toString()}`, { headers: getAuthHeaders() });
      }
      if (!peosRes.ok) {
        peosRes = await fetch(`/api/v1/admin-master/peos?${q.toString()}`, { headers: getAuthHeaders() });
      }

      if (posRes.ok) {
        const posJson = await posRes.json();
        setPos(posJson.data || posJson || []);
      }
      if (peosRes.ok) {
        const peosJson = await peosRes.json();
        setPeos(peosJson.data || peosJson || []);
      }
    } catch (err) {
      console.error('[MatrixMapping] Error fetching POs/PEOs:', err);
    }
  }, [getActiveTenantSlug, selectedCourse, selectedBranch]);

  useEffect(() => {
    fetchPosAndPeos();
  }, [fetchPosAndPeos]);

  // 4. Load Units (COs) for Selected Subject
  useEffect(() => {
    if (!selectedSubject) {
      setUnits([]);
      return;
    }
    const loadUnits = async () => {
      const tenant = getActiveTenantSlug();
      try {
        const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
        const subId = currentSub?.id || selectedSubject;
        const subCode = currentSub?.code || selectedSubject;

        const res = await fetch(
          `${API_BASE}/units?subjectId=${encodeURIComponent(subId)}&subjectCode=${encodeURIComponent(subCode)}&tenant=${tenant}`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          const json = await res.json();
          const uList: Unit[] = json.data || json || [];
          setUnits(uList);
        }
      } catch (err) {
        console.error('[MatrixMapping] Error loading units:', err);
      }
    };

    loadUnits();
  }, [selectedSubject, subjects, getActiveTenantSlug]);

  // Local draft cache keys to guarantee numbers stay fixed & never disappear
  const getCoPoDraftKey = useCallback(
    (subjCode: string) => {
      const slug = getActiveTenantSlug();
      return `copo_draft_${slug}_${selectedCourse}_${selectedBranch}_${selectedSemester}_${selectedSection}_${subjCode}`;
    },
    [getActiveTenantSlug, selectedCourse, selectedBranch, selectedSemester, selectedSection]
  );

  const getPoPeoDraftKey = useCallback(() => {
    const slug = getActiveTenantSlug();
    return `popeo_draft_${slug}_${selectedCourse}_${selectedBranch}_${selectedBatch}`;
  }, [getActiveTenantSlug, selectedCourse, selectedBranch, selectedBatch]);

  // 5. Load Saved CO-PO Matrix for Selected Subject
  useEffect(() => {
    if (activeTab !== 'co-po' || !selectedSubject) return;

    let isMounted = true;
    const loadCoPoMatrix = async () => {
      setLoadingMatrix(true);
      const tenant = getActiveTenantSlug();
      const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
      const subId = currentSub?.id || selectedSubject;
      const subCode = currentSub?.code || selectedSubject;

      // Check local storage draft first
      const draftKey = getCoPoDraftKey(subCode);
      let draftData: Record<string, Record<string, number>> | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) draftData = JSON.parse(raw);
        } catch {}
      }

      try {
        const q = new URLSearchParams({
          tenant,
          subjectId: subId,
          subjectCode: subCode,
        });
        if (selectedCourse !== 'all') q.append('courseCd', selectedCourse);
        if (selectedBranch !== 'all') q.append('branchCd', selectedBranch);
        if (selectedBatch !== 'all') q.append('batchYear', selectedBatch);
        if (selectedSemester !== 'all') q.append('semCd', selectedSemester);
        if (selectedSection !== 'all') q.append('section', selectedSection);

        let res = await fetch(`${API_BASE}/co-po-matrix?${q.toString()}`, { headers: getAuthHeaders() });
        if (!res.ok) {
          res = await fetch(`/api/v1/admin-master/co-po-matrix?${q.toString()}`, { headers: getAuthHeaders() });
        }
        if (res.ok && isMounted) {
          const json = await res.json();
          let serverMatrix: Record<string, Record<string, number>> = {};
          if (json.data?.matrix_data && typeof json.data.matrix_data === 'object') {
            Object.entries(json.data.matrix_data).forEach(([key, val]: [string, any]) => {
              if (key !== 'averages' && typeof val === 'object' && val) {
                serverMatrix[key] = { ...val };
              }
            });
          }

          if (Object.keys(serverMatrix).length > 0) {
            setCoPoMatrix(serverMatrix);
            if (typeof window !== 'undefined') {
              localStorage.setItem(draftKey, JSON.stringify(serverMatrix));
            }
          } else if (draftData && Object.keys(draftData).length > 0) {
            setCoPoMatrix(draftData);
          } else {
            setCoPoMatrix({});
          }
        } else if (draftData && isMounted) {
          setCoPoMatrix(draftData);
        }
      } catch (err) {
        console.error('[MatrixMapping] Error loading CO-PO matrix:', err);
        if (draftData && isMounted) setCoPoMatrix(draftData);
      } finally {
        if (isMounted) setLoadingMatrix(false);
      }
    };

    loadCoPoMatrix();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedSubject, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, getActiveTenantSlug, getCoPoDraftKey, subjects]);

  // 6. Load Saved PO-PEO Matrix for Selected Program / Branch
  useEffect(() => {
    if (activeTab !== 'po-peo') return;

    let isMounted = true;
    const loadPoPeoMatrix = async () => {
      setLoadingMatrix(true);
      const tenant = getActiveTenantSlug();

      const draftKey = getPoPeoDraftKey();
      let draftData: Record<string, Record<string, number>> | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) draftData = JSON.parse(raw);
        } catch {}
      }

      try {
        const q = new URLSearchParams({ tenant });
        if (selectedCourse !== 'all') q.append('courseCd', selectedCourse);
        if (selectedBranch !== 'all') q.append('branchCd', selectedBranch);
        if (selectedBatch !== 'all') q.append('batchYear', selectedBatch);

        let res = await fetch(`${API_BASE}/po-peo-matrix?${q.toString()}`, { headers: getAuthHeaders() });
        if (!res.ok) {
          res = await fetch(`/api/v1/admin-master/po-peo-matrix?${q.toString()}`, { headers: getAuthHeaders() });
        }
        if (res.ok && isMounted) {
          const json = await res.json();
          let serverMatrix: Record<string, Record<string, number>> = {};
          if (json.data?.matrix_data && typeof json.data.matrix_data === 'object') {
            Object.entries(json.data.matrix_data).forEach(([key, val]: [string, any]) => {
              if (key !== 'averages' && typeof val === 'object' && val) {
                serverMatrix[key] = { ...val };
              }
            });
          }

          if (Object.keys(serverMatrix).length > 0) {
            setPoPeoMatrix(serverMatrix);
            if (typeof window !== 'undefined') {
              localStorage.setItem(draftKey, JSON.stringify(serverMatrix));
            }
          } else if (draftData && Object.keys(draftData).length > 0) {
            setPoPeoMatrix(draftData);
          } else {
            setPoPeoMatrix({});
          }
        } else if (draftData && isMounted) {
          setPoPeoMatrix(draftData);
        }
      } catch (err) {
        console.error('[MatrixMapping] Error loading PO-PEO matrix:', err);
        if (draftData && isMounted) setPoPeoMatrix(draftData);
      } finally {
        if (isMounted) setLoadingMatrix(false);
      }
    };

    loadPoPeoMatrix();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedCourse, selectedBranch, selectedBatch, getActiveTenantSlug, getPoPeoDraftKey]);

  // Seeding Handlers
  const handleSeedPos = async () => {
    setIsSeeding(true);
    const tenant = getActiveTenantSlug();
    try {
      const q = new URLSearchParams({ tenant });
      if (selectedCourse !== 'all') q.append('courseCd', selectedCourse);
      if (selectedBranch !== 'all') q.append('branchCd', selectedBranch);

      let res = await fetch(`${API_BASE}/pos/seed?${q.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch(`/api/v1/admin-master/pos/seed?${q.toString()}`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
      if (res.ok) {
        const data = await res.json();
        showToast(`Successfully seeded ${data.seededCount || data.count || 14} standard NBA POs (PO1-PO12, PSO1-PSO2)!`, 'success');
        await fetchPosAndPeos();
      } else {
        showToast('Failed to seed Program Outcomes. Check server permissions.', 'error');
      }
    } catch {
      showToast('Network error while seeding POs.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedPeos = async () => {
    setIsSeeding(true);
    const tenant = getActiveTenantSlug();
    try {
      const q = new URLSearchParams({ tenant });
      if (selectedCourse !== 'all') q.append('courseCd', selectedCourse);
      if (selectedBranch !== 'all') q.append('branchCd', selectedBranch);

      let res = await fetch(`${API_BASE}/peos/seed?${q.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch(`/api/v1/admin-master/peos/seed?${q.toString()}`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
      if (res.ok) {
        const data = await res.json();
        showToast(`Successfully seeded ${data.seededCount || data.count || 5} standard PEOs (PEO1-PEO5)!`, 'success');
        await fetchPosAndPeos();
      } else {
        showToast('Failed to seed Program Educational Objectives.', 'error');
      }
    } catch {
      showToast('Network error while seeding PEOs.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Matrix Cell Value Toggle (Cycles: 0 / '-' -> 1 -> 2 -> 3 -> 0 / '-')
  const cycleCellValue = (currentVal: number = 0): number => {
    if (currentVal === 0) return 1;
    if (currentVal === 1) return 2;
    if (currentVal === 2) return 3;
    return 0;
  };

  const handleUpdateCoPoCell = (coCode: string, poCode: string, specificVal?: number) => {
    setCoPoMatrix((prev) => {
      const row = { ...(prev[coCode] || {}) };
      const current = row[poCode] || 0;
      const nextVal = specificVal !== undefined ? specificVal : cycleCellValue(current);
      row[poCode] = nextVal;
      const next = { ...prev, [coCode]: row };

      // Immediately cache to localStorage draft so chosen numbers never disappear
      const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
      const subCode = currentSub?.code || selectedSubject;
      if (subCode && typeof window !== 'undefined') {
        const draftKey = getCoPoDraftKey(subCode);
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleUpdatePoPeoCell = (poCode: string, peoCode: string, specificVal?: number) => {
    setPoPeoMatrix((prev) => {
      const row = { ...(prev[poCode] || {}) };
      const current = row[peoCode] || 0;
      const nextVal = specificVal !== undefined ? specificVal : cycleCellValue(current);
      row[peoCode] = nextVal;
      const next = { ...prev, [poCode]: row };

      if (typeof window !== 'undefined') {
        const draftKey = getPoPeoDraftKey();
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Quick Action Utilities
  const handleBulkSetCoPo = (level: number) => {
    const updated: Record<string, Record<string, number>> = {};
    effectiveUnits.forEach((u) => {
      const code = u.code || u.id;
      updated[code] = {};
      pos.forEach((p) => {
        updated[code][p.code] = level;
      });
    });
    setCoPoMatrix(updated);
    const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
    const subCode = currentSub?.code || selectedSubject;
    if (subCode && typeof window !== 'undefined') {
      const draftKey = getCoPoDraftKey(subCode);
      try {
        localStorage.setItem(draftKey, JSON.stringify(updated));
      } catch {}
    }
    showToast(`Set all CO-PO correlations to ${level === 0 ? 'No correlation (-)' : `Level ${level}`}`, 'info');
  };

  const handleBulkSetPoPeo = (level: number) => {
    const updated: Record<string, Record<string, number>> = {};
    pos.forEach((p) => {
      updated[p.code] = {};
      peos.forEach((peo) => {
        updated[p.code][peo.code] = level;
      });
    });
    setPoPeoMatrix(updated);
    if (typeof window !== 'undefined') {
      const draftKey = getPoPeoDraftKey();
      try {
        localStorage.setItem(draftKey, JSON.stringify(updated));
      } catch {}
    }
    showToast(`Set all PO-PEO correlations to ${level === 0 ? 'No correlation (-)' : `Level ${level}`}`, 'info');
  };

  // Effective List of Units / Fallback COs if subject has no units yet
  const effectiveUnits = useMemo(() => {
    if (units.length > 0) {
      return units.map((u, idx) => ({
        ...u,
        code: u.code && u.code.startsWith('CO') ? u.code : `CO${idx + 1}`,
        name: u.name || `Course Outcome ${idx + 1}`,
        bloom_level: u.bloom_level || (idx === 0 ? 'K2 - Understand' : idx === 1 ? 'K3 - Apply' : idx === 2 ? 'K4 - Analyze' : idx === 3 ? 'K5 - Evaluate' : 'K6 - Create'),
      }));
    }
    // Provide standard CO1-CO5 fallback templates if subject has no units configured
    return [
      { id: 'co-1', code: 'CO1', name: 'Course Outcome 1', bloom_level: 'K2 - Understand', description: 'Fundamental principles and foundational concepts' },
      { id: 'co-2', code: 'CO2', name: 'Course Outcome 2', bloom_level: 'K3 - Apply', description: 'Practical application and procedural implementation' },
      { id: 'co-3', code: 'CO3', name: 'Course Outcome 3', bloom_level: 'K4 - Analyze', description: 'System analysis, diagnostic breakdown, and reasoning' },
      { id: 'co-4', code: 'CO4', name: 'Course Outcome 4', bloom_level: 'K5 - Evaluate', description: 'Performance evaluation, verification, and benchmarking' },
      { id: 'co-5', code: 'CO5', name: 'Course Outcome 5', bloom_level: 'K6 - Create', description: 'Design, system synthesis, and modern problem formulation' },
    ];
  }, [units]);

  // Calculations for CO-PO Matrix
  const coPoCalculations = useMemo(() => {
    // 1. Row Averages for each CO (average of non-zero values)
    const rowAverages: Record<string, number | null> = {};
    effectiveUnits.forEach((u) => {
      const code = u.code || u.id;
      const row = coPoMatrix[code] || {};
      const nonZeroVals = pos
        .map((p) => row[p.code] || 0)
        .filter((v) => v > 0);
      if (nonZeroVals.length > 0) {
        const sum = nonZeroVals.reduce((acc, curr) => acc + curr, 0);
        rowAverages[code] = +(sum / nonZeroVals.length).toFixed(2);
      } else {
        rowAverages[code] = null;
      }
    });

    // 2. Column Averages for each PO (articulation level)
    const colAverages: Record<string, number | null> = {};
    pos.forEach((p) => {
      const colVals = effectiveUnits
        .map((u) => (coPoMatrix[u.code || u.id] || {})[p.code] || 0)
        .filter((v) => v > 0);
      if (colVals.length > 0) {
        const sum = colVals.reduce((acc, curr) => acc + curr, 0);
        colAverages[p.code] = +(sum / colVals.length).toFixed(2);
      } else {
        colAverages[p.code] = null;
      }
    });

    // 3. Overall Subject Articulation Average (average of non-null PO column averages)
    const validColAverages = Object.values(colAverages).filter((v): v is number => v !== null);
    const overallAverage =
      validColAverages.length > 0
        ? +(validColAverages.reduce((acc, curr) => acc + curr, 0) / validColAverages.length).toFixed(2)
        : null;

    return { rowAverages, colAverages, overallAverage };
  }, [effectiveUnits, pos, coPoMatrix]);

  // Calculations for PO-PEO Matrix
  const poPeoCalculations = useMemo(() => {
    // 1. Row Averages for each PO
    const rowAverages: Record<string, number | null> = {};
    pos.forEach((p) => {
      const row = poPeoMatrix[p.code] || {};
      const nonZeroVals = peos
        .map((peo) => row[peo.code] || 0)
        .filter((v) => v > 0);
      if (nonZeroVals.length > 0) {
        const sum = nonZeroVals.reduce((acc, curr) => acc + curr, 0);
        rowAverages[p.code] = +(sum / nonZeroVals.length).toFixed(2);
      } else {
        rowAverages[p.code] = null;
      }
    });

    // 2. Column Averages for each PEO
    const colAverages: Record<string, number | null> = {};
    peos.forEach((peo) => {
      const colVals = pos
        .map((p) => (poPeoMatrix[p.code] || {})[peo.code] || 0)
        .filter((v) => v > 0);
      if (colVals.length > 0) {
        const sum = colVals.reduce((acc, curr) => acc + curr, 0);
        colAverages[peo.code] = +(sum / colVals.length).toFixed(2);
      } else {
        colAverages[peo.code] = null;
      }
    });

    // 3. Overall Program PO-PEO Average
    const validColAverages = Object.values(colAverages).filter((v): v is number => v !== null);
    const overallAverage =
      validColAverages.length > 0
        ? +(validColAverages.reduce((acc, curr) => acc + curr, 0) / validColAverages.length).toFixed(2)
        : null;

    return { rowAverages, colAverages, overallAverage };
  }, [pos, peos, poPeoMatrix]);

  // Save Handlers
  const handleSaveCoPoMatrix = async () => {
    if (!selectedSubject) {
      showToast('Please select a subject first.', 'error');
      return;
    }
    setSavingMatrix(true);
    const tenant = getActiveTenantSlug();
    const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
    const subCode = currentSub?.code || selectedSubject;
    const subId = currentSub?.id || selectedSubject;

    const mappings: Array<{ co_code: string; po_code: string; correlation_level: number }> = [];
    effectiveUnits.forEach((u) => {
      const coCode = u.code || u.id;
      const row = coPoMatrix[coCode] || {};
      pos.forEach((p) => {
        const val = row[p.code] || 0;
        mappings.push({ co_code: coCode, po_code: p.code, correlation_level: val });
      });
    });

    try {
      const payload = {
        college_slug: tenant,
        course_cd: selectedCourse !== 'all' ? selectedCourse : currentSub?.course_cd || undefined,
        branch_cd: selectedBranch !== 'all' ? selectedBranch : currentSub?.branch_cd || undefined,
        batch_year: selectedBatch !== 'all' ? parseInt(selectedBatch, 10) : 2024,
        sem_cd: selectedSemester !== 'all' ? selectedSemester : currentSub?.sem_cd || undefined,
        section: selectedSection !== 'all' ? selectedSection : undefined,
        subject_id: subId,
        subject_code: subCode,
        subject_name: currentSub?.name || 'Subject',
        matrix_data: {
          ...coPoMatrix,
          averages: {
            row_averages: coPoCalculations.rowAverages,
            col_averages: coPoCalculations.colAverages,
            overall_average: coPoCalculations.overallAverage,
          },
        },
        mappings,
      };

      let res = await fetch(`${API_BASE}/co-po-matrix?tenant=${tenant}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`/api/v1/admin-master/co-po-matrix?tenant=${tenant}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        if (typeof window !== 'undefined') {
          const draftKey = getCoPoDraftKey(subCode);
          try {
            localStorage.setItem(draftKey, JSON.stringify(coPoMatrix));
          } catch {}
        }
        showToast(`CO - PO Correlation Matrix for [${subCode}] saved successfully!`, 'success');
      } else {
        showToast('Failed to save matrix. Server returned an error.', 'error');
      }
    } catch {
      showToast('Network error while saving matrix.', 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleSavePoPeoMatrix = async () => {
    setSavingMatrix(true);
    const tenant = getActiveTenantSlug();

    const mappings: Array<{ po_code: string; peo_code: string; correlation_level: number }> = [];
    pos.forEach((p) => {
      const row = poPeoMatrix[p.code] || {};
      peos.forEach((peo) => {
        const val = row[peo.code] || 0;
        mappings.push({ po_code: p.code, peo_code: peo.code, correlation_level: val });
      });
    });

    try {
      const payload = {
        college_slug: tenant,
        course_cd: selectedCourse !== 'all' ? selectedCourse : undefined,
        branch_cd: selectedBranch !== 'all' ? selectedBranch : undefined,
        batch_year: selectedBatch !== 'all' ? parseInt(selectedBatch, 10) : 2024,
        sem_cd: selectedSemester !== 'all' ? selectedSemester : undefined,
        section: selectedSection !== 'all' ? selectedSection : undefined,
        matrix_data: {
          ...poPeoMatrix,
          averages: {
            row_averages: poPeoCalculations.rowAverages,
            col_averages: poPeoCalculations.colAverages,
            overall_average: poPeoCalculations.overallAverage,
          },
        },
        mappings,
      };

      let res = await fetch(`${API_BASE}/po-peo-matrix?tenant=${tenant}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`/api/v1/admin-master/po-peo-matrix?tenant=${tenant}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        if (typeof window !== 'undefined') {
          const draftKey = getPoPeoDraftKey();
          try {
            localStorage.setItem(draftKey, JSON.stringify(poPeoMatrix));
          } catch {}
        }
        showToast('PO - PEO Correlation Matrix saved successfully!', 'success');
      } else {
        showToast('Failed to save PO-PEO matrix. Server returned an error.', 'error');
      }
    } catch {
      showToast('Network error while saving matrix.', 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  // CSV Export Handlers
  const handleExportCoPoCsv = () => {
    const currentSub = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);
    const headers = ['CO Code', 'Bloom Level', ...pos.map((p) => p.code), 'CO Average'];
    const rows: string[][] = effectiveUnits.map((u) => {
      const code = u.code || u.id;
      const row = coPoMatrix[code] || {};
      const poVals = pos.map((p) => (row[p.code] ? String(row[p.code]) : '-'));
      const avg =
        coPoCalculations.rowAverages[code] !== null && coPoCalculations.rowAverages[code] !== undefined
          ? String(coPoCalculations.rowAverages[code])
          : '-';
      return [code, u.bloom_level || 'K2', ...poVals, avg];
    });

    // PO Column articulation averages
    const colAvgRow: string[] = [
      'PO Articulation Level',
      '',
      ...pos.map((p) => {
        const val = coPoCalculations.colAverages[p.code];
        return val !== null && val !== undefined ? String(val) : '-';
      }),
      coPoCalculations.overallAverage !== null && coPoCalculations.overallAverage !== undefined
        ? String(coPoCalculations.overallAverage)
        : '-',
    ];
    rows.push(colAvgRow);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CO_PO_Matrix_${currentSub?.code || 'Subject'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CO-PO Matrix CSV', 'info');
  };

  const handleExportPoPeoCsv = () => {
    const headers = ['PO Code', 'Type', ...peos.map((peo) => peo.code), 'PO Average'];
    const rows: string[][] = pos.map((p) => {
      const row = poPeoMatrix[p.code] || {};
      const peoVals = peos.map((peo) => (row[peo.code] ? String(row[peo.code]) : '-'));
      const avg =
        poPeoCalculations.rowAverages[p.code] !== null && poPeoCalculations.rowAverages[p.code] !== undefined
          ? String(poPeoCalculations.rowAverages[p.code])
          : '-';
      return [p.code, p.type || 'PO', ...peoVals, avg];
    });

    const colAvgRow: string[] = [
      'PEO Articulation Level',
      '',
      ...peos.map((peo) => {
        const val = poPeoCalculations.colAverages[peo.code];
        return val !== null && val !== undefined ? String(val) : '-';
      }),
      poPeoCalculations.overallAverage !== null && poPeoCalculations.overallAverage !== undefined
        ? String(poPeoCalculations.overallAverage)
        : '-',
    ];
    rows.push(colAvgRow);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PO_PEO_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported PO-PEO Matrix CSV', 'info');
  };

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubject || s.code === selectedSubject);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar with dynamic role */}
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Outcome-Based Education (OBE) Matrix Mapping" />

        <main className="p-4 md:p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0F172A] print:p-0 print:bg-white">
          {/* Toast Notification Alert */}
          {toast && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold transition-all shadow-lg flex items-center justify-between ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : toast.type === 'error'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {toast.type === 'info' && <Info className="w-4 h-4" />}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* PAGE HERO / TITLE CARD adhering to Theme.md */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 print:hidden">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-white shadow-md shadow-[#5B4BFF]/20">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight flex items-center gap-2">
                    OBE Matrix Correlation Mapping
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                      NBA & NAAC Compliant
                    </span>
                  </h1>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                    Map Course Outcomes (COs) to Program Outcomes (POs/PSOs) and POs to Program Educational Objectives (PEOs).
                  </p>
                </div>
              </div>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex items-center p-1.5 bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab('co-po')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'co-po'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>1. CO - PO Mapping(Matrix)</span>
              </button>
              <button
                onClick={() => setActiveTab('po-peo')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'po-peo'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>2. PO - PEO Mapping(Matrix)</span>
              </button>
            </div>
          </div>

          {/* CASCADING FILTER BAR adhering to Theme.md & RestrictAPI.md */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                <Filter className="w-4 h-4 text-[#5B4BFF]" />
                <span>Curriculum & Program Scope Filters</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 normal-case hidden sm:inline">
                  (College → Course → Branch → Batch → Semester → Section → Load Subjects)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium text-[11px]">Active Institution:</span>
                <span className="font-bold text-[#5B4BFF] bg-[#5B4BFF]/10 px-3 py-1 rounded-lg border border-[#5B4BFF]/20 text-xs">
                  {colleges.find((c) => String(c.colg_cd) === String(selectedCollege))?.colg_name ||
                   colleges.find((c) => c.slug === selectedCollege)?.colg_name ||
                   getActiveTenantSlug()}
                </span>
              </div>
            </div>

            {/* 7-Step Cascading Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
              {/* 1. College */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  1. College / Campus
                </label>
                <select
                  value={selectedCollege}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  {colleges.map((c) => (
                    <option key={c.colg_cd} value={String(c.colg_cd)}>
                      {c.colg_name} {c.colg_cd ? `(${c.colg_cd})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Course */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  2. Program / Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c, idx) => (
                    <option key={c.course_cd || idx} value={String(c.course_cd)}>
                      {c.course_name || c.course_cd}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  3. Branch / Department
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  <option value="all">All Branches</option>
                  {branches.map((b, idx) => (
                    <option key={b.branch_cd || idx} value={String(b.branch_cd)}>
                      {b.branch_name || b.branch_cd}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  4. Batch Year
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  <option value="all">All Batches</option>
                  {batches.length > 0 ? (
                    batches.map((b, idx) => {
                      const yr = String(b.year || b.batch_cd || '');
                      return (
                        <option key={String(b.batch_cd || idx)} value={yr}>
                          Batch {yr}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="2024">Batch 2024</option>
                      <option value="2023">Batch 2023</option>
                      <option value="2022">Batch 2022</option>
                      <option value="2021">Batch 2021</option>
                    </>
                  )}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  5. Semester / Phase
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Section */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  6. Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium"
                >
                  <option value="all">All Sections</option>
                  <option value="1">Section 1 (A)</option>
                  <option value="2">Section 2 (B)</option>
                  <option value="3">Section 3 (C)</option>
                  <option value="4">Section 4 (D)</option>
                </select>
              </div>

              {/* 7. Load Subjects Button */}
              <div>
                <button
                  type="button"
                  onClick={handleManualLoadSubjects}
                  disabled={loadingSubjects}
                  className="w-full h-10 px-3 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-[#4E3FE6] active:scale-[0.98] rounded-xl shadow-md shadow-[#5B4BFF]/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  title="Query and load curriculum subjects matching cascading filters"
                >
                  {loadingSubjects ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Subjects</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Subject Selector Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Active Subject / Course Code ({subjects.length} loaded)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={activeTab === 'po-peo'}
                  className={`w-full h-10 px-3 text-xs border rounded-xl focus:ring-2 focus:ring-[#5B4BFF] outline-none font-medium transition-all ${
                    activeTab === 'po-peo'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-dashed border-slate-300 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-[#F6F8FC] dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                  }`}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects found for selection. Click "Load Subjects"</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s.id || s.code} value={s.code || s.id}>
                        [{s.code}] {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {currentSubjectObj && activeTab === 'co-po' && (
                <div className="flex items-center gap-2 self-end md:self-auto bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-3 py-2 rounded-xl text-xs">
                  <BookOpen className="w-4 h-4 text-[#5B4BFF]" />
                  <span className="font-extrabold text-[#1B1E28] dark:text-white">
                    {currentSubjectObj.name}
                  </span>
                  <span className="font-black text-[#5B4BFF] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-[11px]">
                    {currentSubjectObj.code}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: CO - PO MAPPING (MATRIX)                                           */}
          {/* ========================================================================= */}
          {activeTab === 'co-po' && (
            <div className="space-y-6">
              {/* Top Matrix Action Bar */}
              <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{currentSubjectObj?.name || 'Selected Subject'}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {currentSubjectObj?.code || 'CO-PO Matrix'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose correlation level: <span className="font-bold text-slate-700 dark:text-slate-300">- (None) | 1 (Low) | 2 (Medium) | 3 (High)</span>. Numbers stay fixed and saved per subject cascade.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {/* Seed POs if 0 POs exist */}
                  {pos.length === 0 && (
                    <button
                      onClick={handleSeedPos}
                      disabled={isSeeding}
                      className="px-3.5 py-2 text-xs font-bold text-[#F36C21] bg-[#F36C21]/10 hover:bg-[#F36C21]/20 rounded-xl border border-[#F36C21]/30 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSeeding ? 'Seeding...' : '🌱 Seed NBA POs & PSOs'}</span>
                    </button>
                  )}

                  {/* Quick Fill Dropdown / Actions */}
                  <div className="flex items-center bg-[#F6F8FC] dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handleBulkSetCoPo(2)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Set all correlations to 2"
                    >
                      Set 2 (Med)
                    </button>
                    <button
                      onClick={() => handleBulkSetCoPo(3)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Set all correlations to 3"
                    >
                      Set 3 (High)
                    </button>
                    <button
                      onClick={() => handleBulkSetCoPo(0)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Clear all correlations"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={handleExportCoPoCsv}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl transition-all"
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl transition-all"
                    title="Print Matrix"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Save Matrix */}
                  <button
                    onClick={handleSaveCoPoMatrix}
                    disabled={savingMatrix}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-[#4E3FE6] rounded-xl shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingMatrix ? 'Saving...' : 'Save CO-PO Matrix'}</span>
                  </button>
                </div>
              </div>

              {/* Matrix Articulation Summary KPI Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Course Outcomes (COs)</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{effectiveUnits.length}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Mapped course units</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                    CO
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Program Outcomes (POs)</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{pos.length}</p>
                    <p className="text-[10px] text-slate-500 font-medium">NBA PO1-PO12 + PSOs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    PO
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Subject Articulation Level</p>
                    <p className="text-xl font-black text-[#5B4BFF]">
                      {coPoCalculations.overallAverage !== null ? coPoCalculations.overallAverage : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">Overall PO Column Mean</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">NBA OBE Status</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {coPoCalculations.overallAverage ? 'Mapped & Verified' : 'Draft In Progress'}
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tier-1 / Tier-2 Rubrics</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* CO-PO MATRIX INTERACTIVE TABLE */}
              <div className="rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2D2575] text-white text-xs font-bold uppercase tracking-wider">
                        <th className="p-3.5 pl-5 sticky left-0 z-20 bg-[#2D2575] min-w-[200px]">
                          Course Outcome (CO)
                        </th>
                        <th className="p-3.5 text-center min-w-[120px]">Bloom's Level</th>
                        {pos.map((p) => (
                          <th
                            key={p.code}
                            className="p-3.5 text-center min-w-[58px] cursor-help relative group"
                            title={`${p.code}: ${p.title} - ${p.description || ''}`}
                          >
                            <span>{p.code}</span>
                            {/* Hover info badge */}
                            <span className="block text-[9px] font-normal text-indigo-200 uppercase">
                              {p.type || 'PO'}
                            </span>
                          </th>
                        ))}
                        <th className="p-3.5 text-center bg-[#231c5c] sticky right-0 z-20 min-w-[100px]">
                          CO Row Avg
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {effectiveUnits.map((u, idx) => {
                        const coCode = u.code || u.id;
                        const rowVals = coPoMatrix[coCode] || {};
                        const rowAvg = coPoCalculations.rowAverages[coCode];

                        return (
                          <tr
                            key={coCode || idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* CO Name / Details */}
                            <td className="p-3.5 pl-5 sticky left-0 z-10 bg-white dark:bg-[#1B1E28] border-r border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {coCode}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                    {u.name || `Course Outcome ${idx + 1}`}
                                  </p>
                                  {u.description && (
                                    <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[180px]" title={u.description}>
                                      {u.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Bloom's Level */}
                            <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                {u.bloom_level || 'K2 - Understand'}
                              </span>
                            </td>

                            {/* Correlation Cells (PO1..PO12, PSOs) */}
                            {pos.map((p) => {
                              const val = rowVals[p.code] || 0;
                              return (
                                <td
                                  key={p.code}
                                  className="p-1.5 text-center border-r border-slate-100 dark:border-slate-800"
                                >
                                  <div className="flex items-center justify-center">
                                    <select
                                      value={val}
                                      onChange={(e) => handleUpdateCoPoCell(coCode, p.code, Number(e.target.value))}
                                      className={`w-12 h-9 rounded-xl font-black text-xs text-center cursor-pointer transition-all shadow-sm outline-none border focus:ring-2 focus:ring-[#5B4BFF] ${
                                        val === 3
                                          ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-[#5B4BFF]/30'
                                          : val === 2
                                          ? 'bg-sky-500 text-white border-sky-500 shadow-sky-500/30'
                                          : val === 1
                                          ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/30'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                      }`}
                                      title={`${coCode} - ${p.code}: ${val === 0 ? 'None (-)' : `Level ${val}`}`}
                                    >
                                      <option value={0} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">-</option>
                                      <option value={1} className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold">1</option>
                                      <option value={2} className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold">2</option>
                                      <option value={3} className="bg-white dark:bg-slate-900 text-[#5B4BFF] dark:text-[#7867FF] font-bold">3</option>
                                    </select>
                                  </div>
                                </td>
                              );
                            })}

                            {/* Row Average */}
                            <td className="p-3 text-center font-extrabold sticky right-0 z-10 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                              <span
                                className={`px-2 py-1 rounded-md ${
                                  rowAvg !== null
                                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                {rowAvg !== null ? rowAvg.toFixed(2) : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {/* PO Column Articulation Level (Average of each PO) */}
                      <tr className="bg-[#F6F8FC] dark:bg-slate-900/90 font-black border-t-2 border-indigo-200 dark:border-indigo-900">
                        <td className="p-3.5 pl-5 sticky left-0 z-10 bg-[#F6F8FC] dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">
                          PO Articulation Level (Column Average)
                        </td>
                        <td className="p-3 text-center text-slate-400">-</td>
                        {pos.map((p) => {
                          const colAvg = coPoCalculations.colAverages[p.code];
                          return (
                            <td key={p.code} className="p-3 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded-lg text-xs font-black ${
                                  colAvg !== null
                                    ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/30'
                                    : 'text-slate-400'
                                }`}
                              >
                                {colAvg !== null ? colAvg.toFixed(2) : '-'}
                              </span>
                            </td>
                          );
                        })}
                        {/* Overall Subject CO-PO Articulation Level */}
                        <td className="p-3 text-center sticky right-0 z-10 bg-[#2D2575] text-white font-black text-sm">
                          {coPoCalculations.overallAverage !== null
                            ? coPoCalculations.overallAverage.toFixed(2)
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NBA OBE Correlation Legend adhering to Theme.md */}
              <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-[#5B4BFF]" />
                  <span>NBA OBE Correlation Level Rubrics & Scoring Scale</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#5B4BFF] text-white font-black flex items-center justify-center text-sm shadow">
                      3
                    </span>
                    <div>
                      <p className="font-extrabold text-indigo-900 dark:text-indigo-200">Substantial / High (3)</p>
                      <p className="text-[11px] text-slate-500">Strong direct contribution to outcome attainment</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black flex items-center justify-center text-sm shadow">
                      2
                    </span>
                    <div>
                      <p className="font-extrabold text-sky-900 dark:text-sky-200">Moderate / Medium (2)</p>
                      <p className="text-[11px] text-slate-500">Significant supporting conceptual relevance</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow">
                      1
                    </span>
                    <div>
                      <p className="font-extrabold text-amber-900 dark:text-amber-200">Slight / Low (1)</p>
                      <p className="text-[11px] text-slate-500">Minor, indirect or contextual correlation</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black flex items-center justify-center text-sm">
                      -
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-300">No Correlation (-)</p>
                      <p className="text-[11px] text-slate-500">Zero correlation; excluded from average divisor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PO - PEO MAPPING (MATRIX)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'po-peo' && (
            <div className="space-y-6">
              {/* Top Matrix Action Bar */}
              <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Program Outcomes (POs) to Program Educational Objectives (PEOs) Matrix</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Evaluates how program graduate attributes align with 3–5 year post-graduation career objectives.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {/* Seed PEOs button if 0 PEOs */}
                  {peos.length === 0 && (
                    <button
                      onClick={handleSeedPeos}
                      disabled={isSeeding}
                      className="px-3.5 py-2 text-xs font-bold text-[#F36C21] bg-[#F36C21]/10 hover:bg-[#F36C21]/20 rounded-xl border border-[#F36C21]/30 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSeeding ? 'Seeding...' : '🏆 Seed Standard PEOs'}</span>
                    </button>
                  )}

                  {/* Quick Fill Dropdown / Actions */}
                  <div className="flex items-center bg-[#F6F8FC] dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handleBulkSetPoPeo(2)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Set all correlations to 2"
                    >
                      Set 2 (Med)
                    </button>
                    <button
                      onClick={() => handleBulkSetPoPeo(3)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Set all correlations to 3"
                    >
                      Set 3 (High)
                    </button>
                    <button
                      onClick={() => handleBulkSetPoPeo(0)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
                      title="Clear all correlations"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={handleExportPoPeoCsv}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl transition-all"
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl transition-all"
                    title="Print Matrix"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Save Matrix */}
                  <button
                    onClick={handleSavePoPeoMatrix}
                    disabled={savingMatrix}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-[#4E3FE6] rounded-xl shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingMatrix ? 'Saving...' : 'Save PO-PEO Matrix'}</span>
                  </button>
                </div>
              </div>

              {/* PO-PEO Summary KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Program Outcomes (POs)</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{pos.length}</p>
                    <p className="text-[10px] text-slate-500 font-medium">PO1 - PO12 & PSOs</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
                    PO
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Program Educational Objectives</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{peos.length}</p>
                    <p className="text-[10px] text-slate-500 font-medium">PEO1 - PEO5 Defined</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    PEO
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Overall PO-PEO Articulation</p>
                    <p className="text-xl font-black text-[#5B4BFF]">
                      {poPeoCalculations.overallAverage !== null ? poPeoCalculations.overallAverage : 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">Program Level Articulation</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-[20px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">NBA Criterion 1 & 2</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Curriculum Aligned
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Accreditation Ready</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* PO-PEO MATRIX INTERACTIVE TABLE */}
              <div className="rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2D2575] text-white text-xs font-bold uppercase tracking-wider">
                        <th className="p-3.5 pl-5 sticky left-0 z-20 bg-[#2D2575] min-w-[240px]">
                          Program Outcome (PO / PSO)
                        </th>
                        <th className="p-3.5 text-center min-w-[80px]">Type</th>
                        {peos.map((peo) => (
                          <th
                            key={peo.code}
                            className="p-3.5 text-center min-w-[100px] cursor-help relative group"
                            title={`${peo.code}: ${peo.title} - ${peo.description || ''}`}
                          >
                            <span>{peo.code}</span>
                            <span className="block text-[9px] font-normal text-indigo-200 line-clamp-1">
                              {peo.title}
                            </span>
                          </th>
                        ))}
                        <th className="p-3.5 text-center bg-[#231c5c] sticky right-0 z-20 min-w-[110px]">
                          PO Row Avg
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {pos.map((p, idx) => {
                        const rowVals = poPeoMatrix[p.code] || {};
                        const rowAvg = poPeoCalculations.rowAverages[p.code];

                        return (
                          <tr
                            key={p.code || idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* PO Statement */}
                            <td className="p-3.5 pl-5 sticky left-0 z-10 bg-white dark:bg-[#1B1E28] border-r border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {p.code}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{p.title}</p>
                                  {p.description && (
                                    <p
                                      className="text-[10px] text-slate-400 line-clamp-1 max-w-[220px]"
                                      title={p.description}
                                    >
                                      {p.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Type (PO / PSO) */}
                            <td className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  p.type === 'PSO'
                                    ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                {p.type || 'PO'}
                              </span>
                            </td>

                            {/* Correlation Cells (PEO1..PEO5) */}
                            {peos.map((peo) => {
                              const val = rowVals[peo.code] || 0;
                              return (
                                <td
                                  key={peo.code}
                                  className="p-1.5 text-center border-r border-slate-100 dark:border-slate-800"
                                >
                                  <div className="flex items-center justify-center">
                                    <select
                                      value={val}
                                      onChange={(e) => handleUpdatePoPeoCell(p.code, peo.code, Number(e.target.value))}
                                      className={`w-12 h-9 rounded-xl font-black text-xs text-center cursor-pointer transition-all shadow-sm outline-none border focus:ring-2 focus:ring-[#5B4BFF] ${
                                        val === 3
                                          ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-[#5B4BFF]/30'
                                          : val === 2
                                          ? 'bg-sky-500 text-white border-sky-500 shadow-sky-500/30'
                                          : val === 1
                                          ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/30'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                      }`}
                                      title={`${p.code} - ${peo.code}: ${val === 0 ? 'None (-)' : `Level ${val}`}`}
                                    >
                                      <option value={0} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">-</option>
                                      <option value={1} className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold">1</option>
                                      <option value={2} className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold">2</option>
                                      <option value={3} className="bg-white dark:bg-slate-900 text-[#5B4BFF] dark:text-[#7867FF] font-bold">3</option>
                                    </select>
                                  </div>
                                </td>
                              );
                            })}

                            {/* Row Average */}
                            <td className="p-3 text-center font-extrabold sticky right-0 z-10 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                              <span
                                className={`px-2 py-1 rounded-md ${
                                  rowAvg !== null
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                {rowAvg !== null ? rowAvg.toFixed(2) : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {/* PEO Column Articulation Level */}
                      <tr className="bg-[#F6F8FC] dark:bg-slate-900/90 font-black border-t-2 border-emerald-200 dark:border-emerald-900">
                        <td className="p-3.5 pl-5 sticky left-0 z-10 bg-[#F6F8FC] dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">
                          PEO Articulation Level (Column Average)
                        </td>
                        <td className="p-3 text-center text-slate-400">-</td>
                        {peos.map((peo) => {
                          const colAvg = poPeoCalculations.colAverages[peo.code];
                          return (
                            <td key={peo.code} className="p-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                                  colAvg !== null
                                    ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/30'
                                    : 'text-slate-400'
                                }`}
                              >
                                {colAvg !== null ? colAvg.toFixed(2) : '-'}
                              </span>
                            </td>
                          );
                        })}
                        {/* Overall PO-PEO Articulation Average */}
                        <td className="p-3 text-center sticky right-0 z-10 bg-[#2D2575] text-white font-black text-sm">
                          {poPeoCalculations.overallAverage !== null
                            ? poPeoCalculations.overallAverage.toFixed(2)
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Program Educational Objectives (PEOs) Statements Summary Card */}
              <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-[#5B4BFF]" />
                    <span>Program Educational Objectives (PEOs) Defined for Program</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {peos.length} Objectives Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {peos.map((peo) => (
                    <div
                      key={peo.id || peo.code}
                      className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                          {peo.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Target: {peo.peo_order || 1}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {peo.title}
                      </h4>
                      {peo.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
                          {peo.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
