'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  fetchFacultyLinkedSubjects,
  getTenantSlug,
  getTenantName,
  FacultySubjectLink,
} from '@/hooks/useTenantAcademicData';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '@/components/faculty/FacultyAcademicCascadingDropdown';
import { useRolePermissions } from '@/lib/useRolePermissions';

// Data Interfaces
interface UnitItem {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_year?: number;
  bloom_level?: string;
  unit_order?: number;
  hours?: number;
  is_active?: boolean;
}

interface TopicItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  bloom_level?: string;
  hours?: number;
  course_cd?: string;
  branch_cd?: string;
  is_active?: boolean;
}

interface SubTopicItem {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  topic_id?: string;
  topic_code?: string;
  topic_name?: string;
  domain?: string;
  level?: string;
  bloom_level?: string;
  is_core?: boolean;
}

interface StagedSubTopic {
  code: string;
  name: string;
  description: string;
  domain: string;
  level: string;
  bloom_level: string;
}

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  hod_email?: string;
  is_active?: boolean;
}

interface MasterSubjectItem {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  sem_cd?: string;
  credits?: number;
  type?: string;
  is_longitudinal?: boolean;
  is_active?: boolean;
  department_name?: string;
}

interface GuidelineItem {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  professional_phase?: string;
  academic_session?: string;
  description?: string;
  is_active?: boolean;
}

interface SubjectOfferingItem {
  id: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  batch_year?: number;
  batch_code?: string;
  sem_cd?: string;
  semester?: string;
  section?: string;
  credits?: number;
  is_active?: boolean;
}

interface DeliveryTypeItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  type?: string;
  is_active?: boolean;
}

interface ProgramOutcomeItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  type?: string;
  course_cd?: string;
  course_name?: string;
  target_level?: number;
  po_order?: number;
  is_active?: boolean;
}

interface ProgramEducationalObjectiveItem {
  id: string;
  code: string;
  title: string;
  description?: string;
  course_cd?: string;
  course_name?: string;
  peo_order?: number;
  is_active?: boolean;
}

type WorkbenchTabKey =
  | 'departments'
  | 'subjects'
  | 'guidelines'
  | 'offerings'
  | 'delivery_types'
  | 'units'
  | 'topics'
  | 'subtopics'
  | 'pos'
  | 'peos';

interface WorkbenchTabConfig {
  key: WorkbenchTabKey;
  label: string;
  icon: string;
  permissionKey: string;
  adminKey: string;
}

const ALL_WORKBENCH_TABS: WorkbenchTabConfig[] = [
  { key: 'departments', label: '1. Department Master', icon: '🩺', permissionKey: 'faculty_curriculum_subjects_departments', adminKey: 'admin_admin_master_departments' },
  { key: 'subjects', label: '2. Subject Master', icon: '📚', permissionKey: 'faculty_curriculum_subjects_subjects', adminKey: 'admin_admin_master_subjects' },
  { key: 'guidelines', label: '3. Guidelines', icon: '📋', permissionKey: 'faculty_curriculum_subjects_guidelines', adminKey: 'admin_admin_master_guidelines' },
  { key: 'offerings', label: '4. Subject Offerings', icon: '🎓', permissionKey: 'faculty_curriculum_subjects_offerings', adminKey: 'admin_admin_master_offerings' },
  { key: 'delivery_types', label: '5. Delivery Types', icon: '📖', permissionKey: 'faculty_curriculum_subjects_delivery_types', adminKey: 'admin_admin_master_delivery_types' },
  { key: 'units', label: '6. COs Master', icon: '📑', permissionKey: 'faculty_curriculum_subjects_units', adminKey: 'admin_admin_master_units' },
  { key: 'topics', label: '7. Topic Master', icon: '📝', permissionKey: 'faculty_curriculum_subjects_topics', adminKey: 'admin_admin_master_topics' },
  { key: 'subtopics', label: '8. Sub Topics', icon: '🎯', permissionKey: 'faculty_curriculum_subjects_competencies', adminKey: 'admin_admin_master_competencies' },
  { key: 'pos', label: '9. POs', icon: '🎯', permissionKey: 'faculty_curriculum_subjects_pos', adminKey: 'admin_admin_master_pos' },
  { key: 'peos', label: '10. PEOs', icon: '🏆', permissionKey: 'faculty_curriculum_subjects_peos', adminKey: 'admin_admin_master_peos' },
];

const BLOOM_LEVELS = [
  'KL-1 (Remember)',
  'KL-2 (Understand)',
  'KL-3 (Apply)',
  'KL-4 (Analyze)',
  'KL-5 (Evaluate)',
  'KL-6 (Create)',
];

const DOMAINS = ['Knowledge', 'Skills', 'Attitude', 'Values'];
const LEVELS = ['Knows', 'Knows How', 'Shows How', 'Does'];

export default function FacultyCurriculumSubjectsPage() {
  const [tenantSlug, setTenantSlug] = useState('srms-cet-bareilly');
  const [tenantName, setTenantName] = useState('SRMS College of Engineering & Technology');
  const [facultyInfo, setFacultyInfo] = useState<{ id?: string; name?: string; code?: string; designation?: string; department?: string }>({});
  const [linkedSubjects, setLinkedSubjects] = useState<FacultySubjectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cascadeState, setCascadeState] = useState<AcademicCascadingState | null>(null);

  // Active view: 'subjects_overview' | 'curriculum_workbench'
  const [activeView, setActiveView] = useState<'subjects_overview' | 'curriculum_workbench'>('subjects_overview');
  const [selectedSubject, setSelectedSubject] = useState<FacultySubjectLink | null>(null);

  // Dynamic Role Permissions Hook
  const userRole = typeof window !== 'undefined'
    ? (localStorage.getItem('user_role') || localStorage.getItem('role') || 'FACULTY').toUpperCase()
    : 'FACULTY';
  const { isAllowed, enabledKeys } = useRolePermissions(tenantSlug, userRole);

  // Filter tabs dynamically based on SuperAdmin Firm Module Rights
  const visibleWorkbenchTabs = useMemo(() => {
    return ALL_WORKBENCH_TABS.filter((tab) => {
      const facultyAllowed = isAllowed(tab.permissionKey, 'faculty_curriculum_subjects');
      const hasFacultySubTabs = enabledKeys && enabledKeys.some((k) => k.startsWith('faculty_curriculum_subjects_'));
      if (hasFacultySubTabs) {
        return facultyAllowed;
      }
      return facultyAllowed || isAllowed(tab.adminKey, 'admin_admin_master');
    });
  }, [isAllowed, enabledKeys]);

  // Curriculum Workbench Sub-Tabs: defaults to 'units' or first allowed tab
  const [curriculumTab, setCurriculumTab] = useState<WorkbenchTabKey>('units');

  // Automatically switch to first visible tab if active one gets disabled
  useEffect(() => {
    if (visibleWorkbenchTabs.length > 0 && !visibleWorkbenchTabs.some((t) => t.key === curriculumTab)) {
      setCurriculumTab(visibleWorkbenchTabs[0].key);
    }
  }, [visibleWorkbenchTabs, curriculumTab]);

  // Master Data state for the active subject
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopicItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<MasterSubjectItem[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
  const [offerings, setOfferings] = useState<SubjectOfferingItem[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryTypeItem[]>([]);
  const [pos, setPos] = useState<ProgramOutcomeItem[]>([]);
  const [peos, setPeos] = useState<ProgramEducationalObjectiveItem[]>([]);
  const [isSeedingPos, setIsSeedingPos] = useState(false);
  const [isSeedingPeos, setIsSeedingPeos] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Filter within curriculum workbench
  const [filterUnitId, setFilterUnitId] = useState<string>('all');
  const [filterTopicId, setFilterTopicId] = useState<string>('all');
  const [curriculumSearch, setCurriculumSearch] = useState<string>('');

  // Modals state
  const [modalType, setModalType] = useState<'unit' | 'topic' | 'subtopic' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [unitForm, setUnitForm] = useState({
    code: 'CO1',
    name: '',
    description: '',
    bloom_level: 'KL-3 (Apply)',
    unit_order: 1,
    hours: 8,
  });

  const [topicForm, setTopicForm] = useState({
    unit_id: '',
    unit_code: '',
    code: '',
    name: '',
    description: '',
    bloom_level: 'KL-2 (Understand)',
    hours: 2,
  });

  const [subTopicForm, setSubTopicForm] = useState({
    unit_id: '',
    unit_code: '',
    topic_id: '',
    topic_code: '',
    code: '',
    name: '',
    description: '',
    domain: 'Knowledge',
    level: 'Knows How',
    bloom_level: 'KL-2 (Understand)',
  });

  const [stagedSubTopics, setStagedSubTopics] = useState<StagedSubTopic[]>([]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Dynamic branch & batch display resolvers to prevent mismatched joins or internal code bleed
  const getBatchDisplay = (item?: FacultySubjectLink | null) => {
    if (!item) return '';
    if (item.batch_name) {
      return item.batch_name.toLowerCase().startsWith('batch') ? item.batch_name : `Batch ${item.batch_name}`;
    }
    if (item.batch_year) {
      return `Batch ${item.batch_year}`;
    }
    if (item.batch_cd && item.batch_cd !== '17') {
      return `Batch ${item.batch_cd}`;
    }
    return 'Batch 2024';
  };

  const getBranchDisplay = (item?: FacultySubjectLink | null) => {
    if (!item) return '';
    const b = (item.branch_name || '').trim();
    if (b && !b.toLowerCase().includes('bba') && !b.toLowerCase().includes('pharmaceutics')) {
      return b;
    }
    return (item as any).subject_department_name || (item as any).faculty_department_name || b || 'Engineering';
  };

  // Load user info & linked subjects
  useEffect(() => {
    const slug = getTenantSlug() || 'srms-cet-bareilly';
    setTenantSlug(slug);
    setTenantName(getTenantName());

    let facId = '';
    let userObj: any = {};
    if (typeof window !== 'undefined') {
      try {
        userObj = JSON.parse(localStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
        facId =
          userObj.emp_id ||
          userObj.faculty_id ||
          userObj.faculty_code ||
          userObj.profile?.emp_id ||
          userObj.profile?.id ||
          userObj.id ||
          localStorage.getItem('empid') ||
          '';
        setFacultyInfo({
          id: facId,
          name: userObj.name || userObj.profile?.name || 'Faculty Member',
          code: userObj.faculty_code || userObj.emp_id || facId,
          designation: userObj.designation || userObj.profile?.designation || 'Faculty',
          department: userObj.department || userObj.profile?.department || 'Engineering',
        });
      } catch {}
    }

    async function loadData() {
      setLoading(true);
      try {
        const links = await fetchFacultyLinkedSubjects(slug, facId);
        setLinkedSubjects(links);
        if (links.length > 0) {
          if (!facultyInfo.name) {
            const first = links[0];
            setFacultyInfo((prev) => ({
              ...prev,
              name: first.faculty_name || prev.name,
              code: first.faculty_code || prev.code,
              designation: (first as any).faculty_designation || prev.designation,
              department: (first as any).faculty_department_name || prev.department,
            }));
          }
          // Default select the first subject if none selected
          setSelectedSubject((prev) => prev || links[0]);
        }
      } catch (e) {
        console.error('Failed to load linked subjects:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter linked subjects based on cascading selection and search query
  const filteredSubjects = useMemo(() => {
    let result = linkedSubjects;

    // Filter by cascade selections if active
    if (cascadeState) {
      if (cascadeState.course?.course_cd) {
        result = result.filter(
          (s) => !s.course_cd || String(s.course_cd) === String(cascadeState.course?.course_cd)
        );
      }
      if (cascadeState.branch?.branch_cd) {
        result = result.filter(
          (s) => !s.branch_cd || String(s.branch_cd) === String(cascadeState.branch?.branch_cd)
        );
      }
      if (cascadeState.batch?.batch_cd) {
        result = result.filter(
          (s) => !s.batch_cd || String(s.batch_cd) === String(cascadeState.batch?.batch_cd)
        );
      }
      if (cascadeState.semester?.sem_cd) {
        result = result.filter(
          (s) => !s.sem_cd || String(s.sem_cd) === String(cascadeState.semester?.sem_cd)
        );
      }
      if (cascadeState.section) {
        const secVal = String(cascadeState.section);
        result = result.filter(
          (s) => !s.section || String(s.section) === secVal
        );
      }
      if (cascadeState.subject) {
        const subVal = String(cascadeState.subject.sub_cd || cascadeState.subject.code || cascadeState.subject.id);
        result = result.filter(
          (s) =>
            String(s.subject_code) === subVal ||
            String(s.subject_id) === subVal
        );
      }
    }

    // Filter by text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          String(s.subject_code || '').toLowerCase().includes(q) ||
          String(s.subject_name || '').toLowerCase().includes(q) ||
          String(s.section || '').toLowerCase().includes(q) ||
          String(s.course_name || '').toLowerCase().includes(q) ||
          String(s.branch_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [linkedSubjects, cascadeState, searchTerm]);

  // Group filtered subjects by distinct subject_code
  const groupedSubjects = useMemo(() => {
    const map = new Map<string, { main: FacultySubjectLink; sections: string[]; items: FacultySubjectLink[] }>();
    filteredSubjects.forEach((item) => {
      const code = String(item.subject_code || item.subject_id || 'SUB');
      if (!map.has(code)) {
        map.set(code, {
          main: item,
          sections: item.section ? [item.section] : [],
          items: [item],
        });
      } else {
        const existing = map.get(code)!;
        existing.items.push(item);
        if (item.section && !existing.sections.includes(item.section)) {
          existing.sections.push(item.section);
        }
      }
    });
    return Array.from(map.values());
  }, [filteredSubjects]);

  // Handle cascading dropdown change
  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setCascadeState(state);
    if (state.subject) {
      const subVal = String(state.subject.sub_cd || state.subject.code || state.subject.id);
      const found = linkedSubjects.find(
        (s) =>
          String(s.subject_code) === subVal ||
          String(s.subject_id) === subVal
      );
      if (found) {
        setSelectedSubject(found);
      }
    }
  };

  // Fetch all 10 sub-modules data for the selected subject
  const loadSubjectCurriculum = useCallback(async (sub: FacultySubjectLink) => {
    if (!sub) return;
    setDataLoading(true);
    const slug = getTenantSlug() || 'srms-cet-bareilly';
    const subCode = sub.subject_code || sub.subject_id;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': slug,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // 1. Fetch Units (COs Master)
      const unitParams = new URLSearchParams();
      if (subCode) unitParams.set('subjectCode', String(subCode));
      if (sub.subject_id && /^[0-9a-f-]{36}$/i.test(sub.subject_id)) {
        unitParams.set('subjectId', sub.subject_id);
      }
      const unitRes = await fetch(`/api/v1/admin-master/units?${unitParams.toString()}`, { headers }).catch(() => null);
      const unitData = unitRes && unitRes.ok ? await unitRes.json().catch(() => ({ data: [] })) : { data: [] };
      const loadedUnits: UnitItem[] = Array.isArray(unitData.data) ? unitData.data : [];
      setUnits(loadedUnits);

      // 2. Fetch Topics (Topic Master)
      const topicParams = new URLSearchParams();
      if (subCode) topicParams.set('subjectCode', String(subCode));
      if (sub.subject_id && /^[0-9a-f-]{36}$/i.test(sub.subject_id)) {
        topicParams.set('subjectId', sub.subject_id);
      }
      const topicRes = await fetch(`/api/v1/admin-master/topics?${topicParams.toString()}`, { headers }).catch(() => null);
      const topicData = topicRes && topicRes.ok ? await topicRes.json().catch(() => ({ data: [] })) : { data: [] };
      const loadedTopics: TopicItem[] = Array.isArray(topicData.data) ? topicData.data : [];
      setTopics(loadedTopics);

      // 3. Fetch Sub-Topics (Competencies)
      const compParams = new URLSearchParams();
      if (subCode) compParams.set('subjectCode', String(subCode));
      if (sub.subject_id && /^[0-9a-f-]{36}$/i.test(sub.subject_id)) {
        compParams.set('subjectId', sub.subject_id);
      }
      const compRes = await fetch(`/api/v1/admin-master/competencies?${compParams.toString()}`, { headers }).catch(() => null);
      const compData = compRes && compRes.ok ? await compRes.json().catch(() => ({ data: [] })) : { data: [] };
      const loadedSubTopics: SubTopicItem[] = Array.isArray(compData.data) ? compData.data : [];
      setSubTopics(loadedSubTopics);

      // 4. Fetch Departments
      const deptRes = await fetch(`/api/v1/admin-master/departments?tenant=${encodeURIComponent(slug)}`, { headers }).catch(() => null);
      const deptData = deptRes && deptRes.ok ? await deptRes.json().catch(() => ({ data: [] })) : { data: [] };
      setDepartments(Array.isArray(deptData.data) ? deptData.data : (Array.isArray(deptData) ? deptData : []));

      // 5. Fetch Master Subjects
      const subjRes = await fetch(`/api/v1/admin-master/subjects?tenant=${encodeURIComponent(slug)}`, { headers }).catch(() => null);
      const subjData = subjRes && subjRes.ok ? await subjRes.json().catch(() => ({ data: [] })) : { data: [] };
      setMasterSubjects(Array.isArray(subjData.data) ? subjData.data : (Array.isArray(subjData) ? subjData : []));

      // 6. Fetch Guidelines (Professional Linkers)
      const guideRes = await fetch(`/api/v1/admin-master/professional-linkers?tenant=${encodeURIComponent(slug)}`, { headers }).catch(() => null);
      const guideData = guideRes && guideRes.ok ? await guideRes.json().catch(() => ({ data: [] })) : { data: [] };
      setGuidelines(Array.isArray(guideData.data) ? guideData.data : (Array.isArray(guideData) ? guideData : []));

      // 7. Fetch Subject Offerings
      const offerRes = await fetch(`/api/v1/admin-master/subject-offerings?tenant=${encodeURIComponent(slug)}`, { headers }).catch(() => null);
      const offerData = offerRes && offerRes.ok ? await offerRes.json().catch(() => ({ data: [] })) : { data: [] };
      setOfferings(Array.isArray(offerData.data) ? offerData.data : (Array.isArray(offerData) ? offerData : []));

      // 8. Fetch Delivery Types
      const delivRes = await fetch(`/api/v1/admin-master/delivery-types?tenant=${encodeURIComponent(slug)}`, { headers }).catch(() => null);
      const delivData = delivRes && delivRes.ok ? await delivRes.json().catch(() => ({ data: [] })) : { data: [] };
      setDeliveryTypes(Array.isArray(delivData.data) ? delivData.data : (Array.isArray(delivData) ? delivData : []));

      // 9. Fetch Program Outcomes (POs)
      const courseParam = sub.course_cd ? `&courseCd=${encodeURIComponent(sub.course_cd)}` : '';
      const posRes = await fetch(`/api/v1/admin-master/pos?tenant=${encodeURIComponent(slug)}${courseParam}`, { headers }).catch(() => null);
      const posData = posRes && posRes.ok ? await posRes.json().catch(() => ({ data: [] })) : { data: [] };
      setPos(Array.isArray(posData.data) ? posData.data : (Array.isArray(posData) ? posData : []));

      // 10. Fetch Program Educational Objectives (PEOs)
      const peosRes = await fetch(`/api/v1/admin-master/peos?tenant=${encodeURIComponent(slug)}${courseParam}`, { headers }).catch(() => null);
      const peosData = peosRes && peosRes.ok ? await peosRes.json().catch(() => ({ data: [] })) : { data: [] };
      setPeos(Array.isArray(peosData.data) ? peosData.data : (Array.isArray(peosData) ? peosData : []));
    } catch (err) {
      console.error('Error fetching curriculum data:', err);
      showToast('Failed to load curriculum records for subject', 'error');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Seeding handlers for POs and PEOs
  const handleSeedPos = async () => {
    setIsSeedingPos(true);
    try {
      const slug = getTenantSlug() || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const courseParam = selectedSubject?.course_cd ? `&courseCd=${encodeURIComponent(selectedSubject.course_cd)}` : '';
      const res = await fetch(`/api/v1/admin-master/pos/seed?tenant=${encodeURIComponent(slug)}${courseParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        showToast('🌱 Successfully seeded NBA Program Outcomes (PO1–PO12 + PSO1–PSO2)!', 'success');
        if (selectedSubject) await loadSubjectCurriculum(selectedSubject);
      } else {
        showToast('Failed to seed POs', 'error');
      }
    } catch (e) {
      showToast('Error seeding POs', 'error');
    } finally {
      setIsSeedingPos(false);
    }
  };

  const handleSeedPeos = async () => {
    setIsSeedingPeos(true);
    try {
      const slug = getTenantSlug() || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const courseParam = selectedSubject?.course_cd ? `&courseCd=${encodeURIComponent(selectedSubject.course_cd)}` : '';
      const res = await fetch(`/api/v1/admin-master/peos/seed?tenant=${encodeURIComponent(slug)}${courseParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        showToast('🌱 Successfully seeded Program Educational Objectives (PEO1–PEO5)!', 'success');
        if (selectedSubject) await loadSubjectCurriculum(selectedSubject);
      } else {
        showToast('Failed to seed PEOs', 'error');
      }
    } catch (e) {
      showToast('Error seeding PEOs', 'error');
    } finally {
      setIsSeedingPeos(false);
    }
  };

  // When selectedSubject changes, load its curriculum
  useEffect(() => {
    if (selectedSubject) {
      loadSubjectCurriculum(selectedSubject);
      setFilterUnitId('all');
      setFilterTopicId('all');
    }
  }, [selectedSubject, loadSubjectCurriculum]);

  // Open modal handlers
  const openAddUnitModal = () => {
    setIsEditing(false);
    setActiveItem(null);
    const nextOrder = units.length + 1;
    setUnitForm({
      code: `CO${nextOrder}`,
      name: '',
      description: '',
      bloom_level: 'KL-3 (Apply)',
      unit_order: nextOrder,
      hours: 8,
    });
    setModalType('unit');
  };

  const openEditUnitModal = (unit: UnitItem) => {
    setIsEditing(true);
    setActiveItem(unit);
    setUnitForm({
      code: unit.code || '',
      name: unit.name || '',
      description: unit.description || '',
      bloom_level: unit.bloom_level || 'KL-3 (Apply)',
      unit_order: unit.unit_order || 1,
      hours: unit.hours || 8,
    });
    setModalType('unit');
  };

  const openAddTopicModal = (preselectedUnitId?: string) => {
    setIsEditing(false);
    setActiveItem(null);
    const targetUnit = units.find((u) => u.id === preselectedUnitId) || units[0];
    const unitCode = targetUnit ? targetUnit.code : 'CO1';
    const nextOrder = topics.filter((t) => t.unit_id === targetUnit?.id || t.unit_code === unitCode).length + 1;
    const subCode = selectedSubject?.subject_code || 'SUB';

    setTopicForm({
      unit_id: targetUnit?.id || '',
      unit_code: unitCode,
      code: `${subCode}-T${nextOrder}`,
      name: '',
      description: '',
      bloom_level: 'KL-2 (Understand)',
      hours: 2,
    });
    setModalType('topic');
  };

  const openEditTopicModal = (topic: TopicItem) => {
    setIsEditing(true);
    setActiveItem(topic);
    setTopicForm({
      unit_id: topic.unit_id || '',
      unit_code: topic.unit_code || '',
      code: topic.code || '',
      name: topic.name || '',
      description: topic.description || '',
      bloom_level: topic.bloom_level || 'KL-2 (Understand)',
      hours: topic.hours || 2,
    });
    setModalType('topic');
  };

  // Helper: auto-increment subtopic sequence number per topic (matching Admin Role logic)
  const getNextSubTopicCodeForTopic = (
    topicCodeOrId?: string,
    existingSubTopics: SubTopicItem[] = [],
    queue: Array<{ code: string }> = []
  ): string => {
    const targetTopic = String(topicCodeOrId || '').trim();
    if (!targetTopic) return 'ST01';
    const cleanTopic = targetTopic.replace(/[-_]ST\d+$/i, '').trim();

    // 1. Gather all existing subtopic codes for this topic
    const matchingCodes: string[] = [];

    existingSubTopics.forEach((c) => {
      const cTopic = String(c.topic_code || c.topic_id || '').trim();
      const cCode = String(c.code || '').trim().toUpperCase();

      if (cleanTopic && (cTopic === cleanTopic || cCode.startsWith(cleanTopic.toUpperCase()))) {
        matchingCodes.push(cCode);
      } else if (!cleanTopic) {
        matchingCodes.push(cCode);
      }
    });

    if (queue && queue.length > 0) {
      queue.forEach((it) => {
        if (it.code) matchingCodes.push(it.code.trim().toUpperCase());
      });
    }

    let maxNum = 0;
    matchingCodes.forEach((code) => {
      const stMatch = code.match(/ST(\d+)/i) || code.match(/(?:^|[-_\s])(\d+)$/);
      if (stMatch && stMatch[1]) {
        const n = parseInt(stMatch[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    const nextNum = Math.max(maxNum + 1, matchingCodes.length + 1);
    const hasPadded = matchingCodes.some((c) => /ST0\d+/i.test(c));
    const nextSeq = hasPadded ? String(nextNum).padStart(2, '0') : String(nextNum);
    if (cleanTopic) {
      return `${cleanTopic}-ST${nextSeq}`;
    }
    return `ST${nextSeq}`;
  };

  const openAddSubTopicModal = (preselectedTopicId?: string) => {
    setIsEditing(false);
    setActiveItem(null);
    setStagedSubTopics([]);
    const targetTopic = topics.find((t) => t.id === preselectedTopicId || t.code === preselectedTopicId) || topics[0];
    const targetUnit = units.find((u) => u.id === targetTopic?.unit_id || u.code === targetTopic?.unit_code) || units[0];
    const topicCode = targetTopic ? targetTopic.code : 'T1';
    const nextCode = getNextSubTopicCodeForTopic(topicCode, subTopics, []);

    setSubTopicForm({
      unit_id: targetUnit?.id || '',
      unit_code: targetUnit?.code || '',
      topic_id: targetTopic?.id || '',
      topic_code: topicCode,
      code: nextCode,
      name: '',
      description: '',
      domain: 'Knowledge',
      level: 'Knows How',
      bloom_level: 'KL-2 (Understand)',
    });
    setModalType('subtopic');
  };

  const openEditSubTopicModal = (subTopic: SubTopicItem) => {
    setIsEditing(true);
    setActiveItem(subTopic);
    setSubTopicForm({
      unit_id: subTopic.unit_id || '',
      unit_code: subTopic.unit_code || '',
      topic_id: subTopic.topic_id || '',
      topic_code: subTopic.topic_code || '',
      code: subTopic.code || '',
      name: subTopic.name || '',
      description: subTopic.description || '',
      domain: subTopic.domain || 'Knowledge',
      level: subTopic.level || 'Knows How',
      bloom_level: subTopic.bloom_level || 'KL-2 (Understand)',
    });
    setModalType('subtopic');
  };

  // Submit Handler for Unit
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!unitForm.code.trim()) {
      showToast('Course Outcome (CO) Code is required', 'error');
      return;
    }
    if (!unitForm.name.trim() && !unitForm.description.trim()) {
      showToast('Please provide a title or description for the Course Outcome', 'error');
      return;
    }

    setIsSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const subCode = selectedSubject.subject_code || selectedSubject.subject_id;
    const payload: any = {
      code: unitForm.code.trim().toUpperCase(),
      name: unitForm.name.trim() || unitForm.code.trim(),
      description: unitForm.description.trim() || unitForm.name.trim(),
      subject_id: selectedSubject.subject_id || subCode,
      subject_code: subCode,
      course_cd: selectedSubject.course_cd || null,
      course_name: selectedSubject.course_name || null,
      branch_cd: selectedSubject.branch_cd || null,
      batch_year: selectedSubject.batch_cd ? Number(selectedSubject.batch_cd) : 2024,
      semester: selectedSubject.sem_cd ? `Semester ${selectedSubject.sem_cd}` : null,
      sem_cd: selectedSubject.sem_cd || null,
      section: selectedSubject.section || null,
      bloom_level: unitForm.bloom_level,
      unit_order: Number(unitForm.unit_order) || 1,
      hours: Number(unitForm.hours) || 8,
    };

    try {
      let url = '/api/v1/admin-master/units';
      let method = 'POST';
      if (isEditing && activeItem?.id) {
        url = `/api/v1/admin-master/units/${activeItem.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save Course Outcome');
      }

      showToast(isEditing ? 'Course Outcome updated successfully' : 'Course Outcome created successfully');
      setModalType(null);
      await loadSubjectCurriculum(selectedSubject);
    } catch (err: any) {
      console.error('Error saving unit:', err);
      showToast(err.message || 'Error saving Course Outcome', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Handler for Topic
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!topicForm.name.trim()) {
      showToast('Topic Name is required', 'error');
      return;
    }

    setIsSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const subCode = selectedSubject.subject_code || selectedSubject.subject_id;
    const matchedUnit = units.find((u) => u.id === topicForm.unit_id || u.code === topicForm.unit_code);

    const payload: any = {
      code: topicForm.code.trim().toUpperCase() || `${subCode}-T${topics.length + 1}`,
      name: topicForm.name.trim(),
      description: topicForm.description.trim() || topicForm.name.trim(),
      subject_id: selectedSubject.subject_id || subCode,
      subject_code: subCode,
      unit_id: matchedUnit?.id || (topicForm.unit_id && /^[0-9a-f-]{36}$/i.test(topicForm.unit_id) ? topicForm.unit_id : null),
      unit_code: matchedUnit?.code || topicForm.unit_code || null,
      course_cd: selectedSubject.course_cd || null,
      branch_cd: selectedSubject.branch_cd || null,
      batch_year: selectedSubject.batch_cd ? Number(selectedSubject.batch_cd) : 2024,
      bloom_level: topicForm.bloom_level,
      hours: Number(topicForm.hours) || 2,
    };

    try {
      let url = '/api/v1/admin-master/topics';
      let method = 'POST';
      if (isEditing && activeItem?.id) {
        url = `/api/v1/admin-master/topics/${activeItem.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save Topic');
      }

      showToast(isEditing ? 'Topic updated successfully' : 'Topic created successfully');
      setModalType(null);
      await loadSubjectCurriculum(selectedSubject);
    } catch (err: any) {
      console.error('Error saving topic:', err);
      showToast(err.message || 'Error saving Topic', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Queue Handlers for adding multiple Sub-Topics in sequence
  const handleAddToQueue = () => {
    const code = subTopicForm.code.trim().toUpperCase();
    const name = subTopicForm.name.trim();
    const desc = subTopicForm.description.trim() || name;

    if (!code) {
      showToast('Please enter Sub-Topic Code', 'error');
      return;
    }
    if (!name && !desc) {
      showToast('Please enter Sub-Topic Name / Learning Objective', 'error');
      return;
    }

    if (stagedSubTopics.some((it) => it.code === code)) {
      showToast(`Sub-Topic code "${code}" is already in the queue`, 'error');
      return;
    }

    const newItem: StagedSubTopic = {
      code,
      name,
      description: desc,
      domain: subTopicForm.domain,
      level: subTopicForm.level,
      bloom_level: subTopicForm.bloom_level,
    };

    const nextQueue = [...stagedSubTopics, newItem];
    setStagedSubTopics(nextQueue);

    // Auto increment code for next sub-topic as per topic
    const nextCode = getNextSubTopicCodeForTopic(subTopicForm.topic_code, subTopics, nextQueue);
    setSubTopicForm((prev) => ({
      ...prev,
      code: nextCode,
      name: '',
      description: '',
    }));
    showToast(`Added ${code} to batch! Next auto code: ${nextCode}`);
  };

  const handleRemoveFromQueue = (index: number) => {
    const updated = stagedSubTopics.filter((_, idx) => idx !== index);
    setStagedSubTopics(updated);
    const nextCode = getNextSubTopicCodeForTopic(subTopicForm.topic_code, subTopics, updated);
    setSubTopicForm((prev) => ({ ...prev, code: nextCode }));
  };

  // Submit Handler for Sub-Topic (Supports single save or batch queue)
  const handleSaveSubTopic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSubject) return;

    const currentName = subTopicForm.name.trim();
    const currentDesc = subTopicForm.description.trim();
    const currentCode = subTopicForm.code.trim().toUpperCase();

    let itemsToSave: Array<{
      code: string;
      name: string;
      description: string;
      domain: string;
      level: string;
      bloom_level: string;
      is_core: boolean;
    }> = [];

    if (stagedSubTopics.length > 0) {
      itemsToSave = stagedSubTopics.map((it) => ({
        ...it,
        is_core: true,
      }));
      // If user also typed in the input fields before hitting save, include it
      if (currentName || currentDesc) {
        if (!currentCode) {
          showToast('Please provide a Sub-Topic Code for current entry', 'error');
          return;
        }
        itemsToSave.push({
          code: currentCode,
          name: currentName || currentDesc,
          description: currentDesc || currentName,
          domain: subTopicForm.domain,
          level: subTopicForm.level,
          bloom_level: subTopicForm.bloom_level,
          is_core: true,
        });
      }
    } else {
      // Single item save (or edit)
      if (!currentName && !currentDesc) {
        showToast('Sub-Topic Name / Learning Objective is required', 'error');
        return;
      }
      if (!currentCode) {
        showToast('Sub-Topic Code is required', 'error');
        return;
      }
      itemsToSave.push({
        code: currentCode,
        name: currentName || currentDesc,
        description: currentDesc || currentName,
        domain: subTopicForm.domain,
        level: subTopicForm.level,
        bloom_level: subTopicForm.bloom_level,
        is_core: true,
      });
    }

    if (itemsToSave.length === 0) {
      showToast('No sub-topics to save', 'error');
      return;
    }

    setIsSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const subCode = selectedSubject.subject_code || selectedSubject.subject_id;
    const matchedUnit = units.find((u) => u.id === subTopicForm.unit_id || u.code === subTopicForm.unit_code);
    const matchedTopic = topics.find((t) => t.id === subTopicForm.topic_id || t.code === subTopicForm.topic_code);

    try {
      if (isEditing && activeItem?.id) {
        const payload = {
          code: currentCode,
          name: currentName || currentDesc,
          description: currentDesc || currentName,
          subject_id: selectedSubject.subject_id || subCode,
          subject_code: subCode,
          unit_id: matchedUnit?.id || (subTopicForm.unit_id && /^[0-9a-f-]{36}$/i.test(subTopicForm.unit_id) ? subTopicForm.unit_id : null),
          unit_code: matchedUnit?.code || subTopicForm.unit_code || null,
          topic_id: matchedTopic?.id || (subTopicForm.topic_id && /^[0-9a-f-]{36}$/i.test(subTopicForm.topic_id) ? subTopicForm.topic_id : null),
          topic_code: matchedTopic?.code || subTopicForm.topic_code || null,
          course_cd: selectedSubject.course_cd || null,
          branch_cd: selectedSubject.branch_cd || null,
          domain: subTopicForm.domain,
          level: subTopicForm.level,
          bloom_level: subTopicForm.bloom_level,
          is_core: true,
        };
        const res = await fetch(`/api/v1/admin-master/competencies/${activeItem.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Failed to update Sub-Topic');
        }
        showToast('Sub-Topic updated successfully');
      } else {
        const payload: any = {
          subject_id: selectedSubject.subject_id || subCode,
          subject_code: subCode,
          unit_id: matchedUnit?.id || (subTopicForm.unit_id && /^[0-9a-f-]{36}$/i.test(subTopicForm.unit_id) ? subTopicForm.unit_id : null),
          unit_code: matchedUnit?.code || subTopicForm.unit_code || null,
          topic_id: matchedTopic?.id || (subTopicForm.topic_id && /^[0-9a-f-]{36}$/i.test(subTopicForm.topic_id) ? subTopicForm.topic_id : null),
          topic_code: matchedTopic?.code || subTopicForm.topic_code || null,
          course_cd: selectedSubject.course_cd || null,
          branch_cd: selectedSubject.branch_cd || null,
          items: itemsToSave,
          code: itemsToSave[0].code,
          name: itemsToSave[0].name,
          description: itemsToSave[0].description,
          domain: itemsToSave[0].domain,
          level: itemsToSave[0].level,
          bloom_level: itemsToSave[0].bloom_level,
          is_core: true,
        };

        const res = await fetch('/api/v1/admin-master/competencies', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Failed to save Sub-Topic(s)');
        }

        showToast(
          itemsToSave.length > 1
            ? `Successfully created ${itemsToSave.length} Sub-Topics!`
            : 'Sub-Topic created successfully'
        );
      }

      setStagedSubTopics([]);
      setModalType(null);
      await loadSubjectCurriculum(selectedSubject);
    } catch (err: any) {
      console.error('Error saving subtopic:', err);
      showToast(err.message || 'Error saving Sub-Topic', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handlers
  const handleDeleteItem = async (type: 'unit' | 'topic' | 'subtopic', id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const endpoint =
      type === 'unit' ? `/api/v1/admin-master/units/${id}` :
      type === 'topic' ? `/api/v1/admin-master/topics/${id}` :
      `/api/v1/admin-master/competencies/${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE', headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to delete ${type}`);
      }
      showToast(`Deleted successfully`);
      if (selectedSubject) await loadSubjectCurriculum(selectedSubject);
    } catch (err: any) {
      console.error(`Error deleting ${type}:`, err);
      showToast(err.message || `Error deleting ${type}`, 'error');
    }
  };

  // Switch to Workbench for a subject
  const handleOpenCurriculumForSubject = (item: FacultySubjectLink, targetTab?: WorkbenchTabKey) => {
    setSelectedSubject(item);
    setActiveView('curriculum_workbench');
    if (targetTab && visibleWorkbenchTabs.some((t) => t.key === targetTab)) {
      setCurriculumTab(targetTab);
    } else if (visibleWorkbenchTabs.length > 0) {
      setCurriculumTab(visibleWorkbenchTabs[0].key);
    }
  };

  // Affiliated Department for the active subject
  const affiliatedDepartment = useMemo(() => {
    if (!selectedSubject) return null;
    const dId = (selectedSubject as any).department_id;
    const bCd = selectedSubject.branch_cd;
    const bName = (selectedSubject.branch_name || '').toLowerCase();
    return departments.find((d) =>
      (dId && (d.id === dId || d.code === dId)) ||
      (bCd && (d.code === bCd || d.branch_cd === bCd)) ||
      (bName && d.name && d.name.toLowerCase() === bName) ||
      (selectedSubject.course_cd && d.course_cd === selectedSubject.course_cd)
    ) || null;
  }, [departments, selectedSubject]);

  // Filtered workbench items
  const filteredDepartmentsList = useMemo(() => {
    let list = departments;
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (d) =>
          String(d.code || '').toLowerCase().includes(q) ||
          String(d.name || '').toLowerCase().includes(q) ||
          String(d.course_name || d.course_cd || '').toLowerCase().includes(q) ||
          String(d.hod_email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [departments, curriculumSearch]);

  const filteredMasterSubjectsList = useMemo(() => {
    let list: any[] = linkedSubjects.length > 0 ? linkedSubjects : masterSubjects;
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (s) =>
          String(s.subject_code || s.code || '').toLowerCase().includes(q) ||
          String(s.subject_name || s.name || '').toLowerCase().includes(q) ||
          String(s.course_name || s.course_cd || '').toLowerCase().includes(q) ||
          String(s.branch_name || s.branch_cd || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [linkedSubjects, masterSubjects, curriculumSearch]);

  const filteredGuidelinesList = useMemo(() => {
    let list = guidelines;
    if (selectedSubject?.course_cd) {
      const courseMatch = list.filter((g) => String(g.course_cd || '').toLowerCase() === String(selectedSubject.course_cd).toLowerCase());
      if (courseMatch.length > 0) list = courseMatch;
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (g) =>
          String(g.code || '').toLowerCase().includes(q) ||
          String(g.name || '').toLowerCase().includes(q) ||
          String(g.description || '').toLowerCase().includes(q) ||
          String(g.professional_phase || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [guidelines, selectedSubject, curriculumSearch]);

  const filteredOfferingsList = useMemo(() => {
    let list = offerings;
    if (selectedSubject) {
      const subCode = String(selectedSubject.subject_code || selectedSubject.subject_id || '').toLowerCase();
      const subId = String(selectedSubject.subject_id || '').toLowerCase();
      const exactMatches = list.filter((o) =>
        (o.subject_code && String(o.subject_code).toLowerCase() === subCode) ||
        (o.subject_id && String(o.subject_id).toLowerCase() === subId)
      );
      if (exactMatches.length > 0) {
        list = exactMatches;
      } else if (selectedSubject.course_cd) {
        const courseMatches = list.filter((o) => String(o.course_cd || '').toLowerCase() === String(selectedSubject.course_cd).toLowerCase());
        if (courseMatches.length > 0) list = courseMatches;
      }
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.subject_code || '').toLowerCase().includes(q) ||
          String(o.subject_name || '').toLowerCase().includes(q) ||
          String(o.semester || o.sem_cd || '').toLowerCase().includes(q) ||
          String(o.section || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [offerings, selectedSubject, curriculumSearch]);

  const filteredDeliveryTypesList = useMemo(() => {
    let list = deliveryTypes;
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (d) =>
          String(d.code || '').toLowerCase().includes(q) ||
          String(d.name || '').toLowerCase().includes(q) ||
          String(d.description || '').toLowerCase().includes(q) ||
          String(d.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliveryTypes, curriculumSearch]);

  const filteredUnitsList = useMemo(() => {
    let list = units;
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (u) =>
          String(u.code || '').toLowerCase().includes(q) ||
          String(u.name || '').toLowerCase().includes(q) ||
          String(u.description || '').toLowerCase().includes(q) ||
          String(u.bloom_level || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [units, curriculumSearch]);

  const filteredTopicsList = useMemo(() => {
    let list = topics;
    if (filterUnitId !== 'all') {
      const selectedUnit = units.find((u) => u.id === filterUnitId || u.code === filterUnitId);
      const targetUnitCode = selectedUnit?.code || filterUnitId;
      list = list.filter((t) => t.unit_id === filterUnitId || t.unit_code === targetUnitCode || t.unit_code === filterUnitId);
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.code || '').toLowerCase().includes(q) ||
          String(t.name || '').toLowerCase().includes(q) ||
          String(t.description || '').toLowerCase().includes(q) ||
          String(t.unit_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [topics, filterUnitId, curriculumSearch, units]);

  const filteredSubTopicsList = useMemo(() => {
    let list = subTopics;
    if (filterUnitId !== 'all') {
      const selectedUnit = units.find((u) => u.id === filterUnitId || u.code === filterUnitId);
      const targetUnitCode = selectedUnit?.code || filterUnitId;
      list = list.filter((st) => st.unit_id === filterUnitId || st.unit_code === targetUnitCode || st.unit_code === filterUnitId);
    }
    if (filterTopicId !== 'all') {
      const selectedTopic = topics.find((t) => t.id === filterTopicId || t.code === filterTopicId);
      const targetTopicCode = selectedTopic?.code || filterTopicId;
      list = list.filter((st) => st.topic_id === filterTopicId || st.topic_code === targetTopicCode || st.topic_code === filterTopicId);
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (st) =>
          String(st.code || '').toLowerCase().includes(q) ||
          String(st.name || '').toLowerCase().includes(q) ||
          String(st.description || '').toLowerCase().includes(q) ||
          String(st.topic_code || '').toLowerCase().includes(q) ||
          String(st.domain || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [subTopics, filterUnitId, filterTopicId, curriculumSearch, units, topics]);

  const filteredPosList = useMemo(() => {
    let list = pos;
    if (selectedSubject?.course_cd) {
      const courseMatch = list.filter((p) => String(p.course_cd || '').toLowerCase() === String(selectedSubject.course_cd).toLowerCase());
      if (courseMatch.length > 0) list = courseMatch;
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.code || '').toLowerCase().includes(q) ||
          String(p.title || '').toLowerCase().includes(q) ||
          String(p.description || '').toLowerCase().includes(q) ||
          String(p.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [pos, selectedSubject, curriculumSearch]);

  const filteredPeosList = useMemo(() => {
    let list = peos;
    if (selectedSubject?.course_cd) {
      const courseMatch = list.filter((p) => String(p.course_cd || '').toLowerCase() === String(selectedSubject.course_cd).toLowerCase());
      if (courseMatch.length > 0) list = courseMatch;
    }
    if (curriculumSearch.trim()) {
      const q = curriculumSearch.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.code || '').toLowerCase().includes(q) ||
          String(p.title || '').toLowerCase().includes(q) ||
          String(p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [peos, selectedSubject, curriculumSearch]);

  const getTabCount = (tabKey: WorkbenchTabKey): number => {
    switch (tabKey) {
      case 'departments': return filteredDepartmentsList.length;
      case 'subjects': return filteredMasterSubjectsList.length;
      case 'guidelines': return filteredGuidelinesList.length;
      case 'offerings': return filteredOfferingsList.length;
      case 'delivery_types': return filteredDeliveryTypesList.length;
      case 'units': return units.length;
      case 'topics': return topics.length;
      case 'subtopics': return subTopics.length;
      case 'pos': return filteredPosList.length;
      case 'peos': return filteredPeosList.length;
      default: return 0;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header title="My Linked Subjects & Curriculum" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-[1920px] mx-auto flex-1 min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white text-xs font-bold transition-all transform animate-bounce ${
            toastMessage.type === 'success' ? 'bg-[#00C48C]' : 'bg-[#F04438]'
          }`}
        >
          <span>{toastMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
              {tenantName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
              🔒 Official Subject Allocation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/20">
              🏛️ OBE Course Outcomes & Syllabus
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight flex items-center gap-2">
            <span>📚 My Linked Subjects & Curriculum</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
            Teaching load assigned to <strong className="text-[#1B1E28] dark:text-white">{facultyInfo.name || 'Faculty Member'}</strong> {facultyInfo.code ? `(${facultyInfo.code})` : ''} — Link and manage Course Outcomes (Units), Topics, and Sub-Topics directly for your subjects.
          </p>
        </div>

        {/* Quick stats chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-center min-w-[85px]">
            <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Subjects</div>
            <div className="text-base font-black text-purple-700 dark:text-purple-300">{groupedSubjects.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-center min-w-[85px]">
            <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">Units (COs)</div>
            <div className="text-base font-black text-blue-700 dark:text-blue-300">{units.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-center min-w-[85px]">
            <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Topics</div>
            <div className="text-base font-black text-indigo-700 dark:text-indigo-300">{topics.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center min-w-[85px]">
            <div className="text-[9px] font-bold text-[#00C48C] uppercase">Sub-Topics</div>
            <div className="text-base font-black text-emerald-700 dark:text-emerald-300">{subTopics.length}</div>
          </div>
        </div>
      </div>

      {/* 5-Level Cascading Hierarchy Dropdown Filter with Section & Subject */}
      <FacultyAcademicCascadingDropdown
        onSelectionChange={handleAcademicCascadeChange}
        showSubject={true}
        showSection={true}
        onlyLinkedSubjects={true}
        title="🏛️ Filter Academic Hierarchy"
        subtitle="College → Course → Branch → Batch → Semester → Section → Linked Subject"
      />

      {/* Navigation View Switcher (Allocated Subjects vs Curriculum Manager) */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-2 sm:p-3 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveView('subjects_overview')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeView === 'subjects_overview'
                ? 'bg-[#5B4BFF] text-white shadow-md'
                : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEF2FF]'
            }`}
          >
            <span>📚 Allocated Subjects Cards</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeView === 'subjects_overview' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-[#1B1E28]'}`}>
              {groupedSubjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('curriculum_workbench')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeView === 'curriculum_workbench'
                ? 'bg-[#5B4BFF] text-white shadow-md'
                : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEF2FF]'
            }`}
          >
            <span>📑 Curriculum Workbench ({visibleWorkbenchTabs.length} Modules)</span>
            {selectedSubject && (
              <span className="hidden md:inline px-2 py-0.5 rounded-md text-[10px] bg-white/20 text-white font-extrabold truncate max-w-[120px]">
                {selectedSubject.subject_code}
              </span>
            )}
          </button>
        </div>

        {activeView === 'subjects_overview' ? (
          /* Search Bar for Subjects Overview */
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, name, section..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] transition-all"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-[#7B8794]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        ) : (
          /* Subject Selector Dropdown in Workbench view */
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-[#7B8794] whitespace-nowrap">Active Subject:</span>
            <select
              value={selectedSubject ? String(selectedSubject.subject_code || selectedSubject.subject_id) : ''}
              onChange={(e) => {
                const targetCode = e.target.value;
                const match = linkedSubjects.find(
                  (s) => String(s.subject_code || s.subject_id) === targetCode
                );
                if (match) setSelectedSubject(match);
              }}
              className="px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-black text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              {groupedSubjects.map((grp) => {
                const s = grp.main;
                const code = s.subject_code || s.subject_id;
                return (
                  <option key={code} value={code}>
                    {code} — {s.subject_name || 'Subject'}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ALLOCATED SUBJECTS CARDS GRID                                     */}
      {/* ========================================================================= */}
      {activeView === 'subjects_overview' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : groupedSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center shadow-soft space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FFF4EC] text-[#F36C21] flex items-center justify-center text-2xl font-bold">
                📋
              </div>
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">No Linked Subjects Found</h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
                {linkedSubjects.length > 0
                  ? `You have ${linkedSubjects.length} linked subject assignments, but none match the current cascading filter selection.`
                  : 'No subjects have been linked to your faculty profile in the ERP master records yet. Please contact the academic administrator.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupedSubjects.map((grp) => {
                const item = grp.main;
                const subCode = item.subject_code || item.subject_id;
                const subName = item.subject_name || 'Subject';
                return (
                  <div
                    key={subCode}
                    className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      {/* Subject code & badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
                          Code: {subCode}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                          ✓ Linked
                        </span>
                      </div>

                      {/* Subject Title */}
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white leading-tight">
                          {subName}
                        </h3>
                        <p className="text-[11px] text-[#7B8794] mt-0.5 font-bold">
                          {item.course_name || 'Degree Program'} • {getBranchDisplay(item)}
                        </p>
                      </div>

                      {/* Metadata Chips */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
                        <div>
                          <span className="text-[10px] text-[#7B8794] uppercase font-bold block">Semester</span>
                          <span className="font-extrabold text-[#1B1E28] dark:text-white">
                            {item.sem_cd ? `Semester ${item.sem_cd}` : 'All Semesters'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7B8794] uppercase font-bold block">Batch</span>
                          <span className="font-extrabold text-[#1B1E28] dark:text-white">
                            {getBatchDisplay(item) || 'All Batches'}
                          </span>
                        </div>
                      </div>

                      {/* Sections List */}
                      {grp.sections.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-[#7B8794] uppercase font-bold block mb-1">
                            Allocated Section(s)
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {grp.sections.map((sec) => (
                              <span
                                key={sec}
                                className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[11px] font-black border border-purple-200"
                              >
                                {sec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 space-y-2">
                      <button
                        onClick={() => handleOpenCurriculumForSubject(item)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:opacity-90 text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>📑 Open Curriculum Workbench ({visibleWorkbenchTabs.length} Modules) →</span>
                      </button>

                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/dashboard/faculty/assessment?subject=${encodeURIComponent(subCode)}`}
                          className="flex-1 text-center py-2 px-3 rounded-xl bg-[#EEF2FF] dark:bg-slate-800 hover:bg-[#5B4BFF] hover:text-white text-[#5B4BFF] dark:text-purple-300 text-xs font-black transition-all border border-[#5B4BFF]/20"
                        >
                          📝 Assessments
                        </Link>
                        <Link
                          href={`/dashboard/faculty/lessons?subject=${encodeURIComponent(subCode)}`}
                          className="flex-1 text-center py-2 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1B1E28] dark:text-white text-xs font-bold border border-[#E7EAF3] dark:border-slate-700 transition-all"
                        >
                          📖 Lessons
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CURRICULUM WORKBENCH (Units / Topics / Sub-Topics)                */}
      {/* ========================================================================= */}
      {activeView === 'curriculum_workbench' && (
        <div className="space-y-6">
          {/* Active Subject Banner */}
          {selectedSubject ? (
            <div className="bg-gradient-to-r from-[#2D2575] to-[#3B309A] rounded-[22px] p-6 text-white shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                    Subject Code: {selectedSubject.subject_code || selectedSubject.subject_id}
                  </span>
                  {selectedSubject.sem_cd && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00C48C]/30 text-emerald-200 border border-[#00C48C]/40">
                      Semester {selectedSubject.sem_cd}
                    </span>
                  )}
                  {selectedSubject.section && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-400/30 text-purple-200 border border-purple-300/40">
                      Section {selectedSubject.section}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {selectedSubject.subject_name || 'Selected Subject'}
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  {selectedSubject.course_name || 'Course'} • {getBranchDisplay(selectedSubject)} • {getBatchDisplay(selectedSubject)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/faculty/assessment?subject=${encodeURIComponent(selectedSubject.subject_code || selectedSubject.subject_id || '')}`}
                  className="px-3.5 py-2 rounded-xl bg-white text-[#2D2575] hover:bg-white/90 text-xs font-black transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>📝 Open Question Bank</span>
                </Link>
                <button
                  onClick={() => setActiveView('subjects_overview')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                >
                  ← Back to Subjects
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <p className="text-sm font-bold text-[#4E5969]">Please select a subject to manage its curriculum.</p>
            </div>
          )}

          {/* Sub-Tabs: Dynamic Horizontal Modules based on SuperAdmin Firm Module Rights */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 sm:p-5 shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
              {/* Tab Buttons dynamically rendered from visibleWorkbenchTabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-thin">
                {visibleWorkbenchTabs.map((tab) => {
                  const isActive = curriculumTab === tab.key;
                  const count = getTabCount(tab.key);
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setCurriculumTab(tab.key);
                        setCurriculumSearch('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#5B4BFF] text-white shadow-md'
                          : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEF2FF] hover:text-[#5B4BFF]'
                      }`}
                    >
                      <span>{tab.icon} {tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-[#1B1E28] dark:text-white'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Add Item / Seed / Refresh */}
              <div className="w-full sm:w-auto flex items-center justify-end gap-2 flex-wrap">
                {curriculumTab === 'units' && (
                  <button
                    onClick={openAddUnitModal}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>➕ Add Course Outcome (CO)</span>
                  </button>
                )}
                {curriculumTab === 'topics' && (
                  <button
                    onClick={() => openAddTopicModal(filterUnitId !== 'all' ? filterUnitId : undefined)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>➕ Add Topic</span>
                  </button>
                )}
                {curriculumTab === 'subtopics' && (
                  <button
                    onClick={() => openAddSubTopicModal(filterTopicId !== 'all' ? filterTopicId : undefined)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>➕ Add Sub-Topic</span>
                  </button>
                )}
                {curriculumTab === 'pos' && (
                  <button
                    onClick={handleSeedPos}
                    disabled={isSeedingPos}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSeedingPos ? '⏳ Seeding...' : '🌱 Seed Standard NBA POs'}</span>
                  </button>
                )}
                {curriculumTab === 'peos' && (
                  <button
                    onClick={handleSeedPeos}
                    disabled={isSeedingPeos}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#D95A15] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isSeedingPeos ? '⏳ Seeding...' : '🌱 Seed Standard PEOs'}</span>
                  </button>
                )}
                {selectedSubject && (
                  <button
                    onClick={() => loadSubjectCurriculum(selectedSubject)}
                    disabled={dataLoading}
                    className="px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-[#EEF2FF] text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all border border-[#E7EAF3] dark:border-slate-700 flex items-center gap-1.5"
                    title="Refresh Module Records"
                  >
                    <span>🔄 {dataLoading ? '...' : 'Refresh'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar inside workbench */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {/* Unit Filter dropdown for Topics and Subtopics */}
                {(curriculumTab === 'topics' || curriculumTab === 'subtopics') && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-[#7B8794]">Unit/CO:</span>
                    <select
                      value={filterUnitId}
                      onChange={(e) => {
                        setFilterUnitId(e.target.value);
                        setFilterTopicId('all');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white"
                    >
                      <option value="all">All Units / COs</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} — {u.name || u.description?.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic Filter dropdown for Subtopics */}
                {curriculumTab === 'subtopics' && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-[#7B8794]">Topic:</span>
                    <select
                      value={filterTopicId}
                      onChange={(e) => setFilterTopicId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white"
                    >
                      <option value="all">All Topics</option>
                      {topics
                        .filter((t) => filterUnitId === 'all' || t.unit_id === filterUnitId || t.unit_code === filterUnitId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code} — {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Text Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={curriculumSearch}
                  onChange={(e) => setCurriculumSearch(e.target.value)}
                  placeholder={`Search ${curriculumTab}...`}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF]"
                />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#7B8794]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Content Display: Units Tab */}
            {curriculumTab === 'units' && (
              <div>
                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Course Outcomes...</div>
                ) : filteredUnitsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">📑</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Course Outcomes Defined Yet</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Define the Course Outcomes (CO1, CO2, etc.) for this subject to build the syllabus hierarchy and link assessment questions.
                    </p>
                    <button
                      onClick={openAddUnitModal}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md inline-flex items-center gap-1.5"
                    >
                      <span>➕ Add First Course Outcome (CO1)</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">CO Code</th>
                          <th className="py-3 px-4">Title & Description</th>
                          <th className="py-3 px-4 w-36">Bloom's Level</th>
                          <th className="py-3 px-4 w-24 text-center">Hours</th>
                          <th className="py-3 px-4 w-28 text-center">Topics</th>
                          <th className="py-3 px-4 w-28 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredUnitsList.map((unit) => {
                          const linkedTopicsCount = topics.filter((t) => t.unit_id === unit.id || t.unit_code === unit.code).length;
                          return (
                            <tr key={unit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-3.5 px-4 font-black">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 text-xs font-black">
                                  {unit.code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#1B1E28] dark:text-white text-xs">{unit.name || unit.code}</div>
                                {unit.description && (
                                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400 line-clamp-2 mt-0.5">
                                    {unit.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200">
                                  {unit.bloom_level || 'KL-2 (Understand)'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28] dark:text-white">
                                {unit.hours || 0} hrs
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => {
                                    setCurriculumTab('topics');
                                    setFilterUnitId(unit.id);
                                  }}
                                  className="text-[11px] font-black text-[#5B4BFF] hover:underline"
                                  title="View Topics for this CO"
                                >
                                  {linkedTopicsCount} topic{linkedTopicsCount === 1 ? '' : 's'} →
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditUnitModal(unit)}
                                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                                    title="Edit Course Outcome"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('unit', unit.id, unit.code)}
                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                                    title="Delete Course Outcome"
                                  >
                                    🗑️
                                  </button>
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
            )}

            {/* Content Display: Topics Tab */}
            {curriculumTab === 'topics' && (
              <div>
                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Topics...</div>
                ) : filteredTopicsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">📝</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Topics Found</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Add lecture syllabus topics under your Course Outcomes to organize the teaching plan.
                    </p>
                    <button
                      onClick={() => openAddTopicModal(filterUnitId !== 'all' ? filterUnitId : undefined)}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md inline-flex items-center gap-1.5"
                    >
                      <span>➕ Add First Topic</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Topic Code</th>
                          <th className="py-3 px-4">Topic Name & Description</th>
                          <th className="py-3 px-4 w-32">Parent CO / Unit</th>
                          <th className="py-3 px-4 w-20 text-center">Hours</th>
                          <th className="py-3 px-4 w-28 text-center">Sub-Topics</th>
                          <th className="py-3 px-4 w-24 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredTopicsList.map((topic) => {
                          const linkedSubTopicsCount = subTopics.filter((st) => st.topic_id === topic.id || st.topic_code === topic.code).length;
                          return (
                            <tr key={topic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-3.5 px-4 font-black">
                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 text-xs font-black">
                                  {topic.code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#1B1E28] dark:text-white text-xs">{topic.name}</div>
                                {topic.description && topic.description !== topic.name && (
                                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {topic.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black border border-blue-200">
                                  🏛️ {topic.unit_code || 'CO'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28] dark:text-white">
                                {topic.hours || 0} hrs
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => {
                                    setCurriculumTab('subtopics');
                                    if (topic.unit_id) setFilterUnitId(topic.unit_id);
                                    setFilterTopicId(topic.id);
                                  }}
                                  className="text-[11px] font-black text-[#5B4BFF] hover:underline"
                                  title="View Sub-Topics"
                                >
                                  {linkedSubTopicsCount} sub-topic{linkedSubTopicsCount === 1 ? '' : 's'} →
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditTopicModal(topic)}
                                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                                    title="Edit Topic"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('topic', topic.id, topic.name)}
                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                                    title="Delete Topic"
                                  >
                                    🗑️
                                  </button>
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
            )}

            {/* Content Display: Sub-Topics (Competencies) Tab */}
            {curriculumTab === 'subtopics' && (
              <div>
                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Sub-Topics...</div>
                ) : filteredSubTopicsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">🎯</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Sub-Topics / Competencies Found</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Break down topics into specific learning objectives and subtopics for granular assessment and OBE tracking.
                    </p>
                    <button
                      onClick={() => openAddSubTopicModal(filterTopicId !== 'all' ? filterTopicId : undefined)}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md inline-flex items-center gap-1.5"
                    >
                      <span>➕ Add First Sub-Topic</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-32">Sub-Topic Code</th>
                          <th className="py-3 px-4">Learning Objective / Description</th>
                          <th className="py-3 px-4 w-40">Parent CO & Topic</th>
                          <th className="py-3 px-4 w-28">Domain</th>
                          <th className="py-3 px-4 w-28">Level</th>
                          <th className="py-3 px-4 w-24 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredSubTopicsList.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-xs font-black">
                                {st.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1B1E28] dark:text-white text-xs">{st.name || st.code}</div>
                              {st.description && (
                                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 line-clamp-2 mt-0.5">
                                  {st.description}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {st.unit_code && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-black border border-blue-200 mr-1">
                                    🏛️ {st.unit_code}
                                  </span>
                                )}
                                {st.topic_code && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-black border border-purple-200">
                                    📝 {st.topic_code}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200">
                                {st.domain || 'Knowledge'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                {st.level || 'Knows How'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditSubTopicModal(st)}
                                  className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                                  title="Edit Sub-Topic"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteItem('subtopic', st.id, st.code)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                                  title="Delete Sub-Topic"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 1. Department Master Tab */}
            {curriculumTab === 'departments' && (
              <div className="space-y-5">
                {/* Affiliated Department Overview for Active Subject */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                          Affiliated Department
                        </span>
                        <span className="text-xs font-bold text-[#7B8794]">
                          Subject: {selectedSubject?.subject_code} • {selectedSubject?.subject_name}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white">
                        🩺 {affiliatedDepartment?.name || getBranchDisplay(selectedSubject)}
                      </h3>
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">
                        Course: <strong>{selectedSubject?.course_name || 'Course'}</strong> ({selectedSubject?.course_cd || '—'}) • Branch Code: <strong>{affiliatedDepartment?.code || selectedSubject?.branch_cd || 'DEPT'}</strong>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-[#7B8794] block uppercase">Department HOD / In-Charge</span>
                      <span className="text-xs font-black text-[#1B1E28] dark:text-white">
                        {affiliatedDepartment?.hod_email || 'Head of Department'}
                      </span>
                      <div className="mt-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          Active Status
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Departments Table */}
                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Department Master records...</div>
                ) : filteredDepartmentsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">🩺</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Department Records Found</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Department directory will appear here once configured in Admin Master.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Dept Code</th>
                          <th className="py-3 px-4">Department Name</th>
                          <th className="py-3 px-4 w-44">Affiliated Course</th>
                          <th className="py-3 px-4 w-48">HOD / Contact</th>
                          <th className="py-3 px-4 w-36 text-center">Affiliation</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredDepartmentsList.map((dept) => {
                          const isAffiliated = affiliatedDepartment?.id === dept.id || affiliatedDepartment?.code === dept.code;
                          return (
                            <tr
                              key={dept.id || dept.code}
                              className={`transition-colors ${
                                isAffiliated
                                  ? 'bg-blue-50/60 dark:bg-blue-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <td className="py-3.5 px-4 font-black">
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-black">
                                  {dept.code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                                {dept.name}
                              </td>
                              <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">
                                {dept.course_name || dept.course_cd || 'All Courses'}
                              </td>
                              <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">
                                {dept.hod_email || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {isAffiliated ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                                    ★ Selected Subject
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#7B8794]">Standard</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                  Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 2. Subject Master Tab */}
            {curriculumTab === 'subjects' && (
              <div className="space-y-5">
                {/* Active Subject Master Details Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-purple-100 dark:border-slate-700">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B4BFF] text-white">
                          Active Subject Master
                        </span>
                        <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                          Code: {selectedSubject?.subject_code || selectedSubject?.subject_id}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-[#1B1E28] dark:text-white">
                        📚 {selectedSubject?.subject_name}
                      </h3>
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">
                        Course: <strong>{selectedSubject?.course_name || 'Course'}</strong> • Branch: <strong>{getBranchDisplay(selectedSubject)}</strong> • Semester: <strong>{selectedSubject?.sem_cd ? `Sem ${selectedSubject.sem_cd}` : '—'}</strong> • Section: <strong>{selectedSubject?.section || 'All'}</strong>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-xs">
                        <span className="text-[9px] font-bold text-[#7B8794] block uppercase">Batch</span>
                        <span className="text-xs font-black text-[#1B1E28] dark:text-white">{getBatchDisplay(selectedSubject)}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-xs">
                        <span className="text-[9px] font-bold text-[#7B8794] block uppercase">Credits</span>
                        <span className="text-xs font-black text-[#5B4BFF]">4.0 Credits</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-xs col-span-2 sm:col-span-1">
                        <span className="text-[9px] font-bold text-[#7B8794] block uppercase">Type</span>
                        <span className="text-xs font-black text-[#00C48C]">Core Subject</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Linked & Master Subjects Switcher Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#4E5969] dark:text-slate-300">
                      Faculty Linked Subjects Directory (Click to Switch Active Subject)
                    </h4>
                    <span className="text-[11px] font-bold text-[#7B8794]">
                      Showing {filteredMasterSubjectsList.length} subjects
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Subject Code</th>
                          <th className="py-3 px-4">Subject Name</th>
                          <th className="py-3 px-4 w-44">Course & Branch</th>
                          <th className="py-3 px-4 w-24 text-center">Semester</th>
                          <th className="py-3 px-4 w-24 text-center">Section</th>
                          <th className="py-3 px-4 w-28 text-center">Batch</th>
                          <th className="py-3 px-4 w-32 text-right">Switch Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredMasterSubjectsList.map((item, idx) => {
                          const code = item.subject_code || item.code || item.subject_id;
                          const isSelected = selectedSubject && (selectedSubject.subject_code === code || selectedSubject.subject_id === item.id);
                          return (
                            <tr
                              key={item.id || `${code}_${idx}`}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-purple-50/60 dark:bg-purple-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <td className="py-3.5 px-4 font-black">
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-black">
                                  {code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                                {item.subject_name || item.name}
                              </td>
                              <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">
                                {item.course_name || 'Course'} • {getBranchDisplay(item)}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28] dark:text-white">
                                {item.sem_cd ? `Sem ${item.sem_cd}` : '—'}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#5B4BFF]">
                                {item.section || 'All'}
                              </td>
                              <td className="py-3.5 px-4 text-center text-[#4E5969] dark:text-slate-400">
                                {getBatchDisplay(item)}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {isSelected ? (
                                  <span className="px-3 py-1 rounded-lg bg-[#5B4BFF] text-white text-[11px] font-black shadow-xs">
                                    ✓ Active
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedSubject(item)}
                                    className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#5B4BFF] text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white text-[11px] font-bold transition-all shadow-xs"
                                  >
                                    Switch →
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Content Display: 3. Guidelines Tab */}
            {curriculumTab === 'guidelines' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
                  <div className="text-2xl">📋</div>
                  <div>
                    <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                      Academic Guidelines & Regulatory Linkers for {selectedSubject?.course_name || 'Selected Course'}
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Council guidelines, curriculum regulations, professional phases, and academic sessions governing this course.
                    </p>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Academic Guidelines...</div>
                ) : filteredGuidelinesList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">📋</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Guidelines Configured</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Academic guidelines for course ({selectedSubject?.course_name || 'Course'}) can be registered in Admin Master.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Guideline Code</th>
                          <th className="py-3 px-4">Title / Framework</th>
                          <th className="py-3 px-4 w-36">Professional Phase</th>
                          <th className="py-3 px-4 w-36">Academic Session</th>
                          <th className="py-3 px-4">Description / Regulatory Notes</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredGuidelinesList.map((g) => (
                          <tr key={g.id || g.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black">
                                {g.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                              {g.name}
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300 font-bold">
                              {g.professional_phase || 'Phase 1'}
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">
                              {g.academic_session || '2024–2025'}
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">
                              {g.description || 'Mandatory curriculum delivery according to statutory university framework.'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 4. Subject Offerings Tab */}
            {curriculumTab === 'offerings' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-start gap-3">
                  <div className="text-2xl">🎓</div>
                  <div>
                    <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                      Active Subject Offerings for {selectedSubject?.subject_name}
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Term allocation, batch enrollments, semester sections, and scheduled credits for this curriculum subject.
                    </p>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Subject Offerings...</div>
                ) : filteredOfferingsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">🎓</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Subject Offerings Found</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Offerings connect this subject to specific batches, semesters, and sections.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Subject Code</th>
                          <th className="py-3 px-4">Subject Title</th>
                          <th className="py-3 px-4 w-40">Course & Branch</th>
                          <th className="py-3 px-4 w-28 text-center">Batch</th>
                          <th className="py-3 px-4 w-24 text-center">Semester</th>
                          <th className="py-3 px-4 w-24 text-center">Section</th>
                          <th className="py-3 px-4 w-24 text-center">Credits</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredOfferingsList.map((o, idx) => {
                          const isCurrent = o.subject_code === selectedSubject?.subject_code;
                          return (
                            <tr
                              key={o.id || idx}
                              className={`transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <td className="py-3.5 px-4 font-black">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-black">
                                  {o.subject_code || selectedSubject?.subject_code}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                                {o.subject_name || selectedSubject?.subject_name}
                              </td>
                              <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">
                                {o.course_name || selectedSubject?.course_name || 'Course'}
                              </td>
                              <td className="py-3.5 px-4 text-center text-[#4E5969] dark:text-slate-400 font-bold">
                                {o.batch_year ? `Batch ${o.batch_year}` : (o.batch_code || getBatchDisplay(selectedSubject))}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28] dark:text-white">
                                {o.semester || o.sem_cd || selectedSubject?.sem_cd || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-center font-black text-[#5B4BFF]">
                                {o.section || selectedSubject?.section || 'All'}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#00C48C]">
                                {o.credits || 4}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                  Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 5. Delivery Types Tab */}
            {curriculumTab === 'delivery_types' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 flex items-start gap-3">
                  <div className="text-2xl">📖</div>
                  <div>
                    <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                      Pedagogical Delivery Modalities for {selectedSubject?.subject_name}
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Authorized delivery modes (Lectures, Practicals, Small Group Teaching, Tutorials, SDL) for syllabus planning.
                    </p>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Delivery Types...</div>
                ) : filteredDeliveryTypesList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">📖</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Delivery Types Configured</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Delivery modes will appear here once configured in Admin Master.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-28">Type Code</th>
                          <th className="py-3 px-4 w-48">Delivery Mode</th>
                          <th className="py-3 px-4 w-36">Category</th>
                          <th className="py-3 px-4">Pedagogical Framework / Description</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredDeliveryTypesList.map((dt) => (
                          <tr key={dt.id || dt.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-black">
                                {dt.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                              {dt.name}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-bold border border-blue-200">
                                {dt.type || 'Instructional'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">
                              {dt.description || 'Interactive pedagogical teaching session.'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 9. POs Tab */}
            {curriculumTab === 'pos' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-purple-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#5B4BFF] text-white">
                        OBE Framework
                      </span>
                      <span className="text-xs font-bold text-[#7B8794]">
                        Course: {selectedSubject?.course_name || 'Engineering / Medical'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      🎯 Program Outcomes (PO1–PO12) & Program Specific Outcomes (PSOs)
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      National Board of Accreditation (NBA) / Medical Council Graduate Attributes mapped to this curriculum.
                    </p>
                  </div>
                  <button
                    onClick={handleSeedPos}
                    disabled={isSeedingPos}
                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{isSeedingPos ? '⏳ Seeding...' : '🌱 Seed Standard NBA POs'}</span>
                  </button>
                </div>

                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading Program Outcomes...</div>
                ) : filteredPosList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">🎯</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No Program Outcomes Defined Yet</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Click below to automatically seed standard NBA Graduate Attributes (PO1–PO12 + PSO1–PSO2) into PostgreSQL for this course.
                    </p>
                    <button
                      onClick={handleSeedPos}
                      disabled={isSeedingPos}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{isSeedingPos ? '⏳ Seeding...' : '🌱 Seed Standard NBA POs (PO1–PO12)'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-24">PO Code</th>
                          <th className="py-3 px-4 w-48">Competency Focus</th>
                          <th className="py-3 px-4">Graduate Attribute / PO Statement</th>
                          <th className="py-3 px-4 w-28 text-center">Target Level</th>
                          <th className="py-3 px-4 w-24 text-center">Type</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredPosList.map((p) => (
                          <tr key={p.id || p.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-black">
                                {p.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                              {p.title}
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">
                              {p.description}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-bold border border-blue-200">
                                Level {p.target_level || 3}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-bold border border-purple-200">
                                {p.type || 'PO'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Content Display: 10. PEOs Tab */}
            {curriculumTab === 'peos' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-amber-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#F36C21] text-white">
                        Program Educational Objectives
                      </span>
                      <span className="text-xs font-bold text-[#7B8794]">
                        Course: {selectedSubject?.course_name || 'Engineering / Medical'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      🏆 Program Educational Objectives (PEO1–PEO5)
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Long-term career accomplishments and professional goals expected of graduates 3–5 years post graduation.
                    </p>
                  </div>
                  <button
                    onClick={handleSeedPeos}
                    disabled={isSeedingPeos}
                    className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#D95A15] text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{isSeedingPeos ? '⏳ Seeding...' : '🌱 Seed Standard PEOs'}</span>
                  </button>
                </div>

                {dataLoading ? (
                  <div className="py-12 text-center text-xs text-[#7B8794] font-bold">Loading PEO records...</div>
                ) : filteredPeosList.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                    <div className="text-3xl">🏆</div>
                    <div className="text-sm font-black text-[#1B1E28] dark:text-white">No PEOs Defined Yet</div>
                    <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                      Click below to seed standard Program Educational Objectives (PEO1–PEO5) into PostgreSQL.
                    </p>
                    <button
                      onClick={handleSeedPeos}
                      disabled={isSeedingPeos}
                      className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#D95A15] text-white text-xs font-black shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{isSeedingPeos ? '⏳ Seeding...' : '🌱 Seed Standard PEOs (PEO1–PEO5)'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] uppercase font-black text-[10px] tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 w-24">PEO Code</th>
                          <th className="py-3 px-4 w-48">Objective Focus</th>
                          <th className="py-3 px-4">PEO Statement / Career Progression</th>
                          <th className="py-3 px-4 w-24 text-center">Order</th>
                          <th className="py-3 px-4 w-24 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredPeosList.map((peo) => (
                          <tr key={peo.id || peo.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 font-black">
                              <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs font-black">
                                {peo.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                              {peo.title}
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">
                              {peo.description}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-[#7B8794]">
                              #{peo.peo_order || 1}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT COURSE OUTCOME (UNIT)                                 */}
      {/* ========================================================================= */}
      {modalType === 'unit' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2D2575] to-[#3B309A] p-5 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white border border-white/30">
                  {selectedSubject?.subject_code} • {selectedSubject?.subject_name}
                </span>
                <h3 className="text-base font-black mt-1">
                  {isEditing ? '✏️ Edit Course Outcome (CO)' : '➕ Add Course Outcome (CO)'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    CO Code <span className="text-[#F04438]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unitForm.code}
                    onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                    placeholder="e.g. CO1, CO2, CO3"
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white uppercase focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Unit Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={unitForm.unit_order}
                    onChange={(e) => setUnitForm({ ...unitForm, unit_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Unit / Outcome Title
                </label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="e.g. Relational Data Models & Constraints"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Outcome Description / Syllabus Statement <span className="text-[#F04438]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  placeholder="Describe what the student will be able to do upon completion of this Course Outcome..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Bloom's Level
                  </label>
                  <select
                    value={unitForm.bloom_level}
                    onChange={(e) => setUnitForm({ ...unitForm, bloom_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {BLOOM_LEVELS.map((bl) => (
                      <option key={bl} value={bl}>
                        {bl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={unitForm.hours}
                    onChange={(e) => setUnitForm({ ...unitForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update CO' : 'Save CO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT TOPIC                                                 */}
      {/* ========================================================================= */}
      {modalType === 'topic' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2D2575] to-[#3B309A] p-5 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white border border-white/30">
                  {selectedSubject?.subject_code} • {selectedSubject?.subject_name}
                </span>
                <h3 className="text-base font-black mt-1">
                  {isEditing ? '✏️ Edit Syllabus Topic' : '➕ Add Syllabus Topic'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTopic} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Linked Course Outcome (Unit) <span className="text-[#F04438]">*</span>
                </label>
                <select
                  required
                  value={topicForm.unit_id}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const uObj = units.find((u) => u.id === uId);
                    setTopicForm({
                      ...topicForm,
                      unit_id: uId,
                      unit_code: uObj?.code || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="">Select Course Outcome...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} — {u.name || u.description?.slice(0, 40)}
                    </option>
                  ))}
                </select>
                {units.length === 0 && (
                  <p className="text-[10px] text-[#F04438] mt-1 font-bold">
                    ⚠️ No Course Outcomes defined yet. Please add a Course Outcome first!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Topic Code <span className="text-[#F04438]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={topicForm.code}
                    onChange={(e) => setTopicForm({ ...topicForm, code: e.target.value })}
                    placeholder="e.g. DBMS-T1, T1"
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white uppercase focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Lecture Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={topicForm.hours}
                    onChange={(e) => setTopicForm({ ...topicForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Topic Title <span className="text-[#F04438]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  placeholder="e.g. Entity-Relationship Data Modeling"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Description / Syllabus Outline
                </label>
                <textarea
                  rows={2}
                  value={topicForm.description}
                  onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                  placeholder="Optional additional notes or detailed topics covered in this lecture..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Bloom's Level
                </label>
                <select
                  value={topicForm.bloom_level}
                  onChange={(e) => setTopicForm({ ...topicForm, bloom_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {BLOOM_LEVELS.map((bl) => (
                    <option key={bl} value={bl}>
                      {bl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update Topic' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT SUB-TOPIC (COMPETENCY)                                */}
      {/* ========================================================================= */}
      {modalType === 'subtopic' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2D2575] to-[#3B309A] p-5 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white border border-white/30">
                  {selectedSubject?.subject_code} • {selectedSubject?.subject_name}
                </span>
                <h3 className="text-base font-black mt-1">
                  {isEditing ? '✏️ Edit Sub-Topic / Competency' : '➕ Add Sub-Topic / Competency'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSubTopic} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Course Outcome (CO)
                  </label>
                  <select
                    value={subTopicForm.unit_id}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const uObj = units.find((u) => u.id === uId);
                      const matchingTopics = topics.filter(
                        (t) => !uId || t.unit_id === uId || t.unit_code === uObj?.code
                      );
                      const firstTopic = matchingTopics[0];
                      const topicCode = firstTopic?.code || '';
                      const autoCode = firstTopic
                        ? getNextSubTopicCodeForTopic(topicCode, subTopics, stagedSubTopics)
                        : subTopicForm.code;

                      setSubTopicForm({
                        ...subTopicForm,
                        unit_id: uId,
                        unit_code: uObj?.code || '',
                        topic_id: firstTopic?.id || '',
                        topic_code: topicCode,
                        code: autoCode,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    <option value="">Select CO...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Parent Topic <span className="text-[#F04438]">*</span>
                  </label>
                  <select
                    required
                    value={subTopicForm.topic_id}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const tObj = topics.find((t) => t.id === tId);
                      const targetUnit = units.find(
                        (u) => u.id === tObj?.unit_id || u.code === tObj?.unit_code
                      );
                      const topicCode = tObj?.code || '';
                      const autoCode = getNextSubTopicCodeForTopic(topicCode, subTopics, stagedSubTopics);

                      setSubTopicForm({
                        ...subTopicForm,
                        topic_id: tId,
                        topic_code: topicCode,
                        unit_id: targetUnit?.id || subTopicForm.unit_id,
                        unit_code: targetUnit?.code || subTopicForm.unit_code,
                        code: autoCode,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    <option value="">Select Topic...</option>
                    {topics
                      .filter(
                        (t) =>
                          !subTopicForm.unit_id ||
                          t.unit_id === subTopicForm.unit_id ||
                          t.unit_code === subTopicForm.unit_code
                      )
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} — {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white">
                    Sub-Topic Code <span className="text-[#F04438]">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#5B4BFF] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                    Auto as per Topic
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={subTopicForm.code}
                  onChange={(e) => setSubTopicForm({ ...subTopicForm, code: e.target.value })}
                  placeholder="e.g. 88622-T3-ST1, 88622-T3-ST2"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white uppercase focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Sub-Topic Name / Learning Objective <span className="text-[#F04438]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subTopicForm.name}
                  onChange={(e) => setSubTopicForm({ ...subTopicForm, name: e.target.value })}
                  placeholder="e.g. Cardinality Ratios and Structural Constraints"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                  Detailed Outcome / Competency Statement
                </label>
                <textarea
                  rows={2}
                  value={subTopicForm.description}
                  onChange={(e) => setSubTopicForm({ ...subTopicForm, description: e.target.value })}
                  placeholder="Explain 1:1, 1:N, and M:N relationships with real-world examples..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Domain
                  </label>
                  <select
                    value={subTopicForm.domain}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, domain: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Level
                  </label>
                  <select
                    value={subTopicForm.level}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, level: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1B1E28] dark:text-white block mb-1">
                    Bloom's
                  </label>
                  <select
                    value={subTopicForm.bloom_level}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, bloom_level: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {BLOOM_LEVELS.map((bl) => (
                      <option key={bl} value={bl}>
                        {bl.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Staging Queue Preview */}
              {!isEditing && stagedSubTopics.length > 0 && (
                <div className="p-3 rounded-xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-[#F36C21]">
                    <span>📋 Queued Sub-Topics ({stagedSubTopics.length})</span>
                    <span className="text-[10px] font-semibold text-slate-500">Will be saved together</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {stagedSubTopics.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-[11px] font-bold text-[#1B1E28] dark:text-white shadow-xs"
                      >
                        <span className="text-[#F36C21] font-mono">{item.code}</span>
                        <span className="truncate max-w-[120px] text-slate-600 dark:text-slate-300">
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(idx)}
                          className="text-slate-400 hover:text-red-500 text-xs ml-0.5"
                          title="Remove from queue"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleAddToQueue}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-[#5B4BFF]/10 hover:bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-indigo-400 text-xs font-bold transition-all border border-[#5B4BFF]/30 flex items-center gap-1.5"
                    title="Add to queue and automatically generate next code"
                  >
                    <span>➕ Add & Next</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#F36C21] hover:bg-[#e05e16] text-white text-xs font-black shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Sub-Topic'
                    : stagedSubTopics.length > 0
                    ? `Save All (${stagedSubTopics.length + (subTopicForm.name.trim() ? 1 : 0)}) Sub-Topics`
                    : 'Save Sub-Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
