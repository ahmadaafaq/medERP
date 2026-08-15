'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onEdit}
      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 rounded-lg transition-all"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 rounded-lg transition-all"
      title="Delete"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
);

const TableSkeleton = ({ colCount = 6 }: { colCount?: number }) => (
  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
    {[...Array(5)].map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse bg-white dark:bg-slate-900">
        <td className="p-4 pl-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
        {[...Array(colCount - 1)].map((_, cIdx) => (
          <td key={cIdx} className="p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

type SubCategory = 'departments' | 'subjects' | 'professional-linkers' | 'subject-offerings' | 'delivery-types' | 'units' | 'topics' | 'competencies';

interface Unit {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_year?: number;
  bloom_level: string;
  unit_order?: number;
  hours?: number;
  college_id?: string;
  college_code?: string;
  college_name?: string;
  college_slug?: string;
  is_active: boolean;
}

interface College {
  id: string;
  code?: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active: boolean;
}

interface ProfessionalLinker {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  professional_phase?: string;
  academic_session?: string;
  description?: string;
  is_active: boolean;
}

interface Department {
  id: string;
  code: string;
  name: string;
  type: string;
  branch_cd?: string;
  course_cd?: string;
  course_code?: string;
  course_name?: string;
  colg_cd?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  hod_user_id?: string;
  hod_email?: string;
  is_active: boolean;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  department_course_name?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_code?: string;
  college_id?: string;
  colg_cd?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  credits: number;
  type: string;
  is_longitudinal?: boolean;
  is_active: boolean;
}

interface Topic {
  id: string;
  code: string;
  name: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  unit_bloom_level?: string;
  bloom_level?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  description?: string;
  hours: number;
  linker_id?: string;
  cbme_code?: string;
  cbme_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  is_active: boolean;
}

interface Competency {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  topic_id?: string;
  topic_name?: string;
  topic_code?: string;
  topic_description?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  domain: string;
  level: string;
  bloom_level?: string;
  is_core: boolean;
  linker_id?: string;
  cbme_code?: string;
  cbme_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  is_active: boolean;
}

interface TempCompetencyItem {
  code: string;
  name?: string;
  description: string;
  domain: string;
  level: string;
  bloom_level?: string;
  is_core: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1/admin-master';
const COLLEGE_API_BASE = 'http://localhost:3001/api/v1/college-master';

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [linkers, setLinkers] = useState<ProfessionalLinker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profPhases, setProfPhases] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Sub-Topic / Competency temporary queue state
  const [tempCompetencies, setTempCompetencies] = useState<TempCompetencyItem[]>([]);
  const [subTopicCode, setSubTopicCode] = useState('');
  const [subTopicName, setSubTopicName] = useState('');
  const [subTopicDesc, setSubTopicDesc] = useState('');
  const [subTopicDomain, setSubTopicDomain] = useState('Knowledge');
  const [subTopicLevel, setSubTopicLevel] = useState('Knows How');
  const [subTopicBloom, setSubTopicBloom] = useState('KL-2 (Understand)');
  const [subTopicCore, setSubTopicCore] = useState(true);

  const getActiveTenantSlug = (): string => {
    if (selectedCollegeFilter !== 'all') {
      const col = colleges.find((c) => c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter || c.code === selectedCollegeFilter);
      return col?.slug || selectedCollegeFilter;
    }
    return 'all';
  };

  const getFormCollegeSlug = (collegeIdOrSlug?: string): string => {
    const target = collegeIdOrSlug || formData.college_id || formData.college_slug;
    return colleges.find((c) => c.id === target || c.slug === target || c.code === target)?.slug
      || colleges[0]?.slug
      || 'srms-ims';
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${COLLEGE_API_BASE}/colleges`);
      if (res.ok) {
        const json = await res.json();
        const list: College[] = json.data || json || [];
        setColleges(list);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading colleges:', err);
    }
  };

  const fetchCategoryData = async (cat?: SubCategory, collegeFilter?: string) => {
    const targetCat = cat || activeTab;
    const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
    let targetTenant = 'all';
    if (filter !== 'all') {
      const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
      targetTenant = matched?.slug || filter;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetCat}?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json || [];
        if (targetCat === 'departments') setDepartments(data);
        if (targetCat === 'subjects') setSubjects(data);
        if (targetCat === 'professional-linkers') setLinkers(data);
        if (targetCat === 'topics') setTopics(data);
        if (targetCat === 'competencies') setCompetencies(data);
        if (targetCat === 'delivery-types') setDeliveryTypes(data);
        if (targetCat === 'subject-offerings') setOfferings(data);
        if (targetCat === 'units') setUnits(data);
      }
    } catch (err) {
      console.error(`[AdminMaster] Error loading ${targetCat}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${COLLEGE_API_BASE}/courses?tenant=all`);
      if (res.ok) {
        const json = await res.json();
        setCourses(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading courses:', err);
    }
  };

  const getCoursesForCollege = (collegeIdOrSlug?: string) => {
    if (!collegeIdOrSlug) return courses;
    const col = colleges.find(c => c.id === collegeIdOrSlug || c.slug === collegeIdOrSlug || c.code === collegeIdOrSlug);
    const targetId = col?.id || collegeIdOrSlug;
    const targetSlug = col?.slug;
    const targetCode = col?.code;

    const filtered = courses.filter((c: any) =>
      c.college_id === targetId ||
      (targetCode && c.college_id === targetCode) ||
      (targetSlug && c.college_slug === targetSlug) ||
      (targetCode && c.college_code === targetCode)
    );
    return filtered.length > 0 ? filtered : courses;
  };

  const fetchProfessionals = async (collegeFilter?: string) => {
    try {
      const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
      let targetTenant = 'all';
      if (filter !== 'all') {
        const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
        targetTenant = matched?.slug || filter;
      }
      const res = await fetch(`${COLLEGE_API_BASE}/professionals?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        setProfPhases(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading professionals:', err);
    }
  };

  const fetchBatches = async (collegeFilter?: string) => {
    try {
      const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
      let targetTenant = 'all';
      if (filter !== 'all') {
        const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
        targetTenant = matched?.slug || filter;
      }
      const res = await fetch(`${COLLEGE_API_BASE}/batches?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        setBatches(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading batches:', err);
    }
  };

  const syncDepartmentsFromPortal = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const targetSlug = getActiveTenantSlug() === 'all' ? 'all' : getActiveTenantSlug();
      const res = await fetch(`${COLLEGE_API_BASE}/branches/sync-external?tenant=${targetSlug}`, {
        method: 'POST',
      });
      if (res.ok) {
        setSyncMessage(`Departments & Specialties synced successfully from SRMS Portal ✅`);
        await fetchCategoryData('departments');
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage('Failed to sync departments from SRMS Portal.');
      }
    } catch (err) {
      console.error('[AdminMaster] Sync error:', err);
      setSyncMessage('Error syncing departments from SRMS Portal.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      await fetchColleges();
      await Promise.all([
        fetchCourses(),
        fetchCategoryData('departments', 'all'),
        fetchCategoryData('subjects', 'all'),
        fetchCategoryData('professional-linkers', 'all'),
        fetchCategoryData('units', 'all'),
        fetchCategoryData('topics', 'all'),
        fetchCategoryData('competencies', 'all'),
        fetchCategoryData('delivery-types', 'all'),
        fetchCategoryData('subject-offerings', 'all'),
        fetchProfessionals('all'),
        fetchBatches('all'),
      ]);
    };
    loadAll();
  }, []);

  const handleCollegeFilterChange = async (newColgFilter: string) => {
    setSelectedCollegeFilter(newColgFilter);
    setSelectedCourseFilter('all');
    setSelectedBranchFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedUnitFilter('all');
    setSelectedTopicFilter('all');
    setCurrentPage(1);
    await Promise.all([
      fetchCourses(),
      fetchCategoryData(activeTab, newColgFilter),
      fetchCategoryData('departments', newColgFilter),
      fetchCategoryData('subjects', newColgFilter),
      fetchCategoryData('units', newColgFilter),
      fetchCategoryData('topics', newColgFilter),
      fetchCategoryData('competencies', newColgFilter),
      fetchProfessionals(newColgFilter),
      fetchBatches(newColgFilter),
    ]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const isMatchCollege = (item: any) => {
    if (selectedCollegeFilter === 'all') return true;
    const targetCol = colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetId = targetCol?.id;
    const targetSlug = targetCol?.slug || selectedCollegeFilter;
    const targetCode = targetCol?.code;
    return (
      (targetId && item.college_id === targetId) ||
      (targetCode && String(item.college_id) === String(targetCode)) ||
      (targetCode && String(item.colg_cd) === String(targetCode)) ||
      (targetCode && String(item.college_code) === String(targetCode)) ||
      (targetSlug && item.college_slug === targetSlug) ||
      item.college_slug === selectedCollegeFilter
    );
  };

  const handleAddNew = () => {
    setEditingItem(null);
    const defaultCol = selectedCollegeFilter !== 'all' 
      ? colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0] 
      : colleges[0];
    
    const defaultCollegeId = defaultCol?.code || defaultCol?.id || '1';
    const defaultCollegeSlug = defaultCol?.slug || 'srms-cet-bareilly';

    if (activeTab === 'departments') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const defaultCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '1';
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        course_cd: defaultCourseCd,
        code: '',
        branch_cd: '',
        name: '',
        type: 'General',
        is_active: true,
      });
    } else if (activeTab === 'subjects') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '1';
      const availableDepts = departments.filter(d => 
        (d.college_id === defaultCollegeId || d.college_slug === defaultCollegeSlug || String(d.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || d.course_cd === firstCourseCd || d.course_code === firstCourseCd)
      );
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        course_cd: firstCourseCd,
        department_id: availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '',
        code: '',
        name: '',
        credits: 4,
        type: 'Combined',
        is_longitudinal: false,
      });
    } else if (activeTab === 'professional-linkers') {
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        code: 'LINK-MBBS-P1',
        name: '',
        course_cd: 'MBBS',
        professional_phase: '1st Professional (Phase I)',
        academic_session: '2024-2025',
        description: '',
      });
    } else if (activeTab === 'subject-offerings') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '1';
      const availableDepts = departments.filter(d => 
        (d.college_id === defaultCollegeId || d.college_slug === defaultCollegeSlug || String(d.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || d.course_cd === firstCourseCd || d.course_code === firstCourseCd)
      );
      const firstBranchCd = availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '1';
      const availableSubjects = subjects.filter(s =>
        (!defaultCollegeId || s.college_id === defaultCollegeId || s.college_slug === defaultCollegeSlug || String(s.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || s.course_cd === firstCourseCd) &&
        (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
      );
      const availableBatches = batches.filter(b =>
        (!defaultCollegeId || b.college_id === defaultCollegeId || b.college_slug === defaultCollegeSlug || String(b.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || b.course_cd === firstCourseCd)
      );
      const availablePhases = profPhases.filter(p =>
        (!defaultCollegeId || p.college_id === defaultCollegeId || p.college_slug === defaultCollegeSlug) &&
        (!firstCourseCd || p.course_cd === firstCourseCd)
      );

      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        course_cd: firstCourseCd,
        branch_cd: firstBranchCd,
        department_id: firstBranchCd,
        subject_id: availableSubjects[0]?.id || subjects[0]?.id || '',
        batch_id: availableBatches[0]?.id || '',
        batch_year: availableBatches[0]?.year || 2024,
        prof_id: availablePhases[0]?.id || profPhases[0]?.id || '',
        dtype_id: deliveryTypes[0]?.id || '',
        hours_allotted: 100,
        is_active: true,
      });
    } else if (activeTab === 'delivery-types') {
      setFormData({ code: '', name: '' });
    } else if (activeTab === 'units') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');
      
      const availableDepts = departments.filter(d => 
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableSubjects = subjects.filter(s =>
        (!targetCol || s.college_id === targetCol.id || s.college_slug === targetCol.slug) &&
        (!chosenCourseCd || s.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || s.branch_cd === chosenBranchCd || s.department_id === chosenBranchCd)
      );
      const chosenSubjectCode = selectedSubjectFilter !== 'all' ? selectedSubjectFilter : (availableSubjects[0]?.code || availableSubjects[0]?.id || '');

      const availableBatches = batches.filter(b =>
        (!targetCol || b.college_id === targetCol.id || b.college_slug === targetCol.slug || String(b.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || b.course_cd === chosenCourseCd)
      );

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        batch_id: availableBatches[0]?.batch_cd || availableBatches[0]?.year || '1',
        batch_year: availableBatches[0]?.year || 2024,
        subject_id: chosenSubjectCode,
        subject_code: chosenSubjectCode,
        code: `UNIT-${units.length + 1}`,
        name: '',
        description: '',
        bloom_level: 'KL-2 (Understand)',
        unit_order: units.length + 1,
        hours: 10,
        is_active: true,
      });
    } else if (activeTab === 'topics') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');

      const availableDepts = departments.filter(d => 
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableSubjects = subjects.filter(s =>
        (!targetCol || s.college_id === targetCol.id || s.college_slug === targetCol.slug) &&
        (!chosenCourseCd || s.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || s.branch_cd === chosenBranchCd || s.department_id === chosenBranchCd)
      );
      const chosenSubject = (selectedSubjectFilter !== 'all' ? availableSubjects.find(s => s.code === selectedSubjectFilter || s.id === selectedSubjectFilter) : null) || availableSubjects[0];
      const chosenSubjectCode = chosenSubject?.code || chosenSubject?.id || '';

      const availableUnits = units.filter(u =>
        (!targetCol || u.college_id === targetCol.id || u.college_slug === targetCol.slug) &&
        (!chosenCourseCd || u.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || u.branch_cd === chosenBranchCd) &&
        (!chosenSubjectCode || u.subject_code === chosenSubjectCode || u.subject_id === chosenSubjectCode)
      );
      const chosenUnit = (selectedUnitFilter !== 'all' ? availableUnits.find(u => u.code === selectedUnitFilter || u.id === selectedUnitFilter) : null) || availableUnits[0];
      const chosenUnitCode = chosenUnit?.code || '';
      const chosenBloom = chosenUnit?.bloom_level || 'KL-2 (Understand)';

      const subPrefix = chosenSubjectCode ? `${chosenSubjectCode}-` : '';
      const unitPrefix = chosenUnitCode ? `${chosenUnitCode.replace('UNIT-', 'U')}-` : '';
      const autoTopicCode = `${subPrefix}${unitPrefix}T${String(topics.length + 1).padStart(2, '0')}`;

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        subject_id: chosenSubjectCode,
        subject_code: chosenSubjectCode,
        unit_id: chosenUnitCode,
        unit_code: chosenUnitCode,
        bloom_level: chosenBloom,
        code: autoTopicCode,
        name: '',
        description: '',
        hours: 2,
        linker_id: linkers[0]?.id || '',
        is_active: true,
      });
    } else if (activeTab === 'competencies') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');

      const availableDepts = departments.filter(d => 
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableSubjects = subjects.filter(s =>
        (!targetCol || s.college_id === targetCol.id || s.college_slug === targetCol.slug) &&
        (!chosenCourseCd || s.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || s.branch_cd === chosenBranchCd || s.department_id === chosenBranchCd)
      );
      const chosenSubject = (selectedSubjectFilter !== 'all' ? availableSubjects.find(s => s.code === selectedSubjectFilter || s.id === selectedSubjectFilter) : null) || availableSubjects[0];
      const chosenSubjectCode = chosenSubject?.code || chosenSubject?.id || '';

      const availableUnits = units.filter(u =>
        (!targetCol || u.college_id === targetCol.id || u.college_slug === targetCol.slug) &&
        (!chosenCourseCd || u.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || u.branch_cd === chosenBranchCd) &&
        (!chosenSubjectCode || u.subject_code === chosenSubjectCode || u.subject_id === chosenSubjectCode)
      );
      const chosenUnit = (selectedUnitFilter !== 'all' ? availableUnits.find(u => u.code === selectedUnitFilter || u.id === selectedUnitFilter) : null) || availableUnits[0];
      const chosenUnitCode = chosenUnit?.code || '';

      const availableTopics = topics.filter(t =>
        (!targetCol || t.college_id === targetCol.id || t.college_slug === targetCol.slug) &&
        (!chosenCourseCd || t.course_cd === chosenCourseCd) &&
        (!chosenBranchCd || t.branch_cd === chosenBranchCd) &&
        (!chosenSubjectCode || t.subject_code === chosenSubjectCode || t.subject_id === chosenSubjectCode) &&
        (!chosenUnitCode || t.unit_code === chosenUnitCode || t.unit_id === chosenUnitCode)
      );
      const chosenTopic = availableTopics[0];
      const chosenTopicCode = chosenTopic?.code || chosenTopic?.id || '';
      const chosenBloom = chosenTopic?.bloom_level || chosenUnit?.bloom_level || 'KL-2 (Understand)';

      const autoSubCode = `${chosenTopicCode ? chosenTopicCode + '-' : ''}ST01`;
      setTempCompetencies([]);
      setSubTopicCode(autoSubCode);
      setSubTopicName('');
      setSubTopicDesc('');
      setSubTopicDomain('Knowledge');
      setSubTopicLevel('Knows How');
      setSubTopicBloom(chosenBloom);
      setSubTopicCore(true);

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        subject_id: chosenSubjectCode,
        subject_code: chosenSubjectCode,
        unit_id: chosenUnitCode,
        unit_code: chosenUnitCode,
        topic_id: chosenTopicCode,
        topic_code: chosenTopicCode,
        bloom_level: chosenBloom,
        code: autoSubCode,
        name: '',
        description: '',
        domain: 'Knowledge',
        level: 'Knows How',
        is_core: true,
        linker_id: linkers[0]?.id || '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const matchedCol = colleges.find(c => c.id === item.college_id || c.code === item.college_id || c.slug === item.college_slug || c.code === item.college_code) || colleges[0];
    const collegeCodeOrId = matchedCol?.code || matchedCol?.id || item.college_id || '1';
    const collegeSlug = matchedCol?.slug || item.college_slug || 'srms-cet-bareilly';

    if (activeTab === 'departments') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || item.course_code || '',
        code: item.branch_cd || item.code || '',
        branch_cd: item.branch_cd || item.code || '',
        name: item.name || '',
        type: item.type || 'General',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'subjects') {
      const matchedCourse = courses.find(c => c.course_cd === item.course_cd || c.code === item.course_cd || c.id === item.course_cd);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedCourse?.course_cd || matchedCourse?.code || '',
        department_id: item.branch_cd || item.department_code || item.department_id || '',
        code: item.code || '',
        name: item.name || '',
        credits: item.credits !== undefined ? Number(item.credits) : 4,
        type: item.type || 'Combined',
        is_longitudinal: Boolean(item.is_longitudinal),
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'professional-linkers') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        code: item.code || '',
        name: item.name || '',
        course_cd: item.course_cd || '',
        professional_phase: item.professional_phase || '',
        academic_session: item.academic_session || '',
        description: item.description || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'subject-offerings') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id);
      const matchedCourseCd = item.course_cd || matchedSubject?.course_cd || '';
      const matchedBranchCd = item.branch_cd || matchedSubject?.branch_cd || matchedSubject?.department_id || '';

      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: matchedCourseCd,
        branch_cd: matchedBranchCd,
        department_id: matchedBranchCd,
        subject_id: item.subject_id || '',
        prof_id: item.prof_id || '',
        dtype_id: item.dtype_id || '',
        batch_year: item.batch_year ? Number(item.batch_year) : 2024,
        hours_allotted: item.hours_allotted !== undefined ? Number(item.hours_allotted) : 100,
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'units') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        batch_id: item.batch_id || item.batch_year || '1',
        batch_year: item.batch_year || 2024,
        subject_id: item.subject_code || matchedSubject?.code || item.subject_id || '',
        subject_code: item.subject_code || matchedSubject?.code || '',
        code: item.code || '',
        name: item.name || item.code || '',
        description: item.description || item.name || '',
        bloom_level: item.bloom_level || 'KL-2 (Understand)',
        unit_order: item.unit_order || 1,
        hours: item.hours || 10,
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'topics') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code);
      const matchedUnit = units.find(u => u.id === item.unit_id || u.code === item.unit_code);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        batch_id: item.batch_id || item.batch_year || '1',
        batch_year: item.batch_year || 2024,
        subject_id: item.subject_code || matchedSubject?.code || item.subject_id || '',
        subject_code: item.subject_code || matchedSubject?.code || '',
        unit_id: item.unit_code || matchedUnit?.code || item.unit_id || '',
        unit_code: item.unit_code || matchedUnit?.code || '',
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        bloom_level: item.bloom_level || matchedUnit?.bloom_level || 'KL-2 (Understand)',
        hours: item.hours !== undefined ? Number(item.hours) : 2,
        linker_id: item.linker_id || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'delivery-types') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        code: item.code || '',
        name: item.name || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'competencies') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code);
      const matchedUnit = units.find(u => u.id === item.unit_id || u.code === item.unit_code);
      const matchedTopic = topics.find(t => t.id === item.topic_id || t.code === item.topic_code);
      setTempCompetencies([]);
      setSubTopicCode(item.code || '');
      setSubTopicName(item.name || '');
      setSubTopicDesc(item.description || '');
      setSubTopicDomain(item.domain || 'Knowledge');
      setSubTopicLevel(item.level || 'Knows How');
      setSubTopicBloom(item.bloom_level || 'KL-2 (Understand)');
      setSubTopicCore(item.is_core !== false);

      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        subject_id: item.subject_code || matchedSubject?.code || item.subject_id || '',
        subject_code: item.subject_code || matchedSubject?.code || '',
        unit_id: item.unit_code || matchedUnit?.code || item.unit_id || '',
        unit_code: item.unit_code || matchedUnit?.code || '',
        topic_id: item.topic_code || matchedTopic?.code || item.topic_id || '',
        topic_code: item.topic_code || matchedTopic?.code || '',
        bloom_level: item.bloom_level || matchedTopic?.bloom_level || matchedUnit?.bloom_level || 'KL-2 (Understand)',
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        domain: item.domain || 'Knowledge',
        level: item.level || 'Knows How',
        is_core: item.is_core !== false,
        linker_id: item.linker_id || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }
  };

  const handleDelete = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const targetSlug = getFormCollegeSlug(itemCollegeSlug || selectedCollegeFilter);
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?tenant=${targetSlug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await Promise.all([
          fetchCategoryData(activeTab, selectedCollegeFilter),
          fetchCategoryData('departments', selectedCollegeFilter),
          fetchCategoryData('subjects', selectedCollegeFilter),
          fetchCategoryData('units', selectedCollegeFilter),
          fetchCategoryData('topics', selectedCollegeFilter),
          fetchCategoryData('competencies', selectedCollegeFilter),
        ]);
      } else {
        const err = await res.text();
        alert(`Delete failed: ${err}`);
      }
    } catch (err) {
      console.error('[AdminMaster] Delete error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = Boolean(editingItem && editingItem.id);
    const targetSlug = getFormCollegeSlug(formData.college_id || formData.college_slug);
    const url = isEdit
      ? `${API_BASE}/${activeTab}/${editingItem.id}?tenant=${targetSlug}`
      : `${API_BASE}/${activeTab}?tenant=${targetSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    let payload: any = {};
    if (activeTab === 'departments') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const branchCdVal = String(formData.code || formData.branch_cd || '1').trim();
      payload = {
        code: branchCdVal,
        branch_cd: branchCdVal,
        name: formData.name?.trim(),
        type: formData.type || 'General',
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        course_name: selectedCourse?.name || null,
        college_id: formData.college_id,
        hod_user_id: formData.hod_user_id || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subjects') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      payload = {
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        department_id: formData.department_id || null,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        course_name: selectedCourse?.name || null,
        branch_cd: formData.department_id || null,
        batch_id: formData.batch_id || null,
        credits: formData.credits !== undefined ? Number(formData.credits) : 4,
        type: formData.type || 'Combined',
        is_longitudinal: Boolean(formData.is_longitudinal),
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'professional-linkers') {
      payload = {
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        course_cd: formData.course_cd?.trim() || null,
        professional_phase: formData.professional_phase?.trim() || null,
        academic_session: formData.academic_session?.trim() || null,
        description: formData.description?.trim() || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subject-offerings') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const subCode = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id;
      const phaseOrder = profPhases.find(p => p.id === formData.prof_id || String(p.phase_order) === String(formData.prof_id))?.phase_order || formData.prof_id;
      const dtypeCode = deliveryTypes.find(dt => dt.id === formData.dtype_id || dt.code === formData.dtype_id)?.code || formData.dtype_id;
      const batchCd = batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === String(formData.batch_id) || String(b.year) === String(formData.batch_id))?.batch_cd || formData.batch_id;

      payload = {
        college_id: formData.college_id,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        branch_cd: formData.branch_cd || formData.department_id || null,
        subject_id: subCode,
        subject_code: subCode,
        prof_id: phaseOrder ? String(phaseOrder) : null,
        phase_order: phaseOrder ? String(phaseOrder) : null,
        dtype_id: dtypeCode,
        dtype_code: dtypeCode,
        batch_year: Number(formData.batch_year || 2024),
        hours_allotted: formData.hours_allotted !== undefined ? Number(formData.hours_allotted) : 0,
        batch_id: batchCd ? String(batchCd) : null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'delivery-types') {
      payload = { code: formData.code, name: formData.name };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'units') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const subCode = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id;
      const batchCd = batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === String(formData.batch_id) || String(b.year) === String(formData.batch_id))?.batch_cd || formData.batch_id;

      payload = {
        college_id: formData.college_id,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        branch_cd: formData.branch_cd || formData.department_id || null,
        batch_id: batchCd ? String(batchCd) : null,
        batch_year: Number(formData.batch_year || 2024),
        subject_id: subCode,
        subject_code: subCode,
        code: formData.code?.trim().toUpperCase(),
        name: formData.name?.trim() || formData.code?.trim(),
        description: formData.description?.trim() || '',
        bloom_level: formData.bloom_level || 'KL-2 (Understand)',
        unit_order: Number(formData.unit_order || 1),
        hours: Number(formData.hours || 0),
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'topics') {
      const subCode = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id;
      const unitCode = units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_code || formData.unit_id;
      const resolvedLinker = linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id || l.id === formData._resolved_linker_id);

      payload = {
        college_id: formData.college_id,
        course_cd: formData.course_cd || null,
        branch_cd: formData.branch_cd || null,
        subject_id: subCode,
        subject_code: subCode,
        unit_id: unitCode || null,
        unit_code: unitCode || null,
        bloom_level: formData.bloom_level || 'KL-2 (Understand)',
        code: formData.code?.trim().toUpperCase(),
        name: formData.name?.trim(),
        description: formData.description?.trim() || null,
        hours: formData.hours !== undefined ? Number(formData.hours) : 2,
        linker_id: resolvedLinker?.id || formData.linker_id || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'competencies') {
      const subCode = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id;
      const unitCode = units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_code || formData.unit_id;
      const topicCode = topics.find(t => t.id === formData.topic_id || t.code === formData.topic_id)?.code || formData.topic_code || formData.topic_id;
      const resolvedLinker = linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id || l.id === formData._resolved_linker_id);

      if (tempCompetencies.length > 0 && !isEdit) {
        payload = {
          college_id: formData.college_id,
          course_cd: formData.course_cd || null,
          branch_cd: formData.branch_cd || null,
          subject_id: subCode,
          subject_code: subCode,
          unit_id: unitCode || null,
          unit_code: unitCode || null,
          topic_id: topicCode || null,
          topic_code: topicCode || null,
          linker_id: resolvedLinker?.id || formData.linker_id || null,
          items: tempCompetencies.map(it => ({
            code: it.code?.trim().toUpperCase(),
            name: it.name?.trim() || null,
            description: it.description?.trim(),
            domain: it.domain || 'Knowledge',
            level: it.level || 'Knows How',
            bloom_level: it.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
            is_core: it.is_core !== false,
          })),
        };
      } else {
        payload = {
          college_id: formData.college_id,
          course_cd: formData.course_cd || null,
          branch_cd: formData.branch_cd || null,
          subject_id: subCode,
          subject_code: subCode,
          unit_id: unitCode || null,
          unit_code: unitCode || null,
          topic_id: topicCode || null,
          topic_code: topicCode || null,
          code: (subTopicCode || formData.code)?.trim().toUpperCase(),
          name: (subTopicName || formData.name)?.trim() || null,
          description: (subTopicDesc || formData.description)?.trim(),
          domain: subTopicDomain || formData.domain || 'Knowledge',
          level: subTopicLevel || formData.level || 'Knows How',
          bloom_level: subTopicBloom || formData.bloom_level || 'KL-2 (Understand)',
          is_core: subTopicCore ?? (formData.is_core !== false),
          linker_id: resolvedLinker?.id || formData.linker_id || null,
        };
      }
      if (isEdit) payload.is_active = formData.is_active !== false;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        await Promise.all([
          fetchCategoryData(activeTab, selectedCollegeFilter),
          fetchCategoryData('departments', selectedCollegeFilter),
          fetchCategoryData('subjects', selectedCollegeFilter),
          fetchCategoryData('units', selectedCollegeFilter),
          fetchCategoryData('topics', selectedCollegeFilter),
          fetchCategoryData('competencies', selectedCollegeFilter),
        ]);
      } else {
        const err = await res.text();
        alert(`Save failed: ${err}`);
      }
    } catch (err) {
      alert('Network error occurred while saving.');
    }
  };

  const categories = [
    { key: 'departments', label: '1. Department Master', icon: '🩺', count: departments.filter(isMatchCollege).length },
    { key: 'subjects', label: '2. Subject Master', icon: '📚', count: subjects.filter(isMatchCollege).length },
    { key: 'professional-linkers', label: '3. Guidelines', icon: '📋', count: linkers.length },
    { key: 'subject-offerings', label: '4. Subject Offerings', icon: '🎓', count: offerings.length },
    { key: 'delivery-types', label: '5. Delivery Types', icon: '📖', count: deliveryTypes.length },
    { key: 'units', label: '6. Unit Master', icon: '📑', count: units.length },
    { key: 'topics', label: '7. Topic Master', icon: '📝', count: topics.length },
    { key: 'competencies', label: '8. Competency Master', icon: '🎯', count: competencies.length },
  ];

  const getFilteredItemsList = () => {
    switch (activeTab) {
      case 'departments': return departments;
      case 'subjects': return subjects;
      case 'professional-linkers': return linkers;
      case 'subject-offerings': return offerings;
      case 'delivery-types': return deliveryTypes;
      case 'units': return units;
      case 'topics': return topics;
      case 'competencies': return competencies;
      default: return [];
    }
  };

  const availableFilterCourses = useMemo(() => {
    if (selectedCollegeFilter === 'all') return courses;
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    return getCoursesForCollege(targetCol?.id || targetCol?.slug);
  }, [selectedCollegeFilter, colleges, courses]);

  const availableFilterBranches = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return departments.filter(d => {
      const matchCol = selectedCollegeFilter === 'all' || 
        d.college_id === targetCol?.id || 
        d.college_slug === targetCol?.slug || 
        String(d.colg_cd) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter === 'all') return true;
      return d.course_cd === selectedCourseFilter || d.course_code === selectedCourseFilter;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, departments, colleges]);

  const availableFilterSubjects = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return subjects.filter(s => {
      const matchCol = selectedCollegeFilter === 'all' || 
        s.college_id === targetCol?.id || 
        s.college_slug === targetCol?.slug || 
        String(s.colg_cd) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && s.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && s.branch_cd !== selectedBranchFilter && s.department_id !== selectedBranchFilter) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, subjects, colleges]);

  const availableFilterUnits = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return units.filter(u => {
      const matchCol = selectedCollegeFilter === 'all' || 
        u.college_id === targetCol?.id || 
        u.college_slug === targetCol?.slug || 
        String(u.college_code) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && u.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && u.branch_cd !== selectedBranchFilter) return false;
      if (selectedSubjectFilter !== 'all' && u.subject_code !== selectedSubjectFilter && u.subject_id !== selectedSubjectFilter) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, selectedSubjectFilter, units, colleges]);

  const availableFilterTopics = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return topics.filter(t => {
      const matchCol = selectedCollegeFilter === 'all' || 
        t.college_id === targetCol?.id || 
        t.college_slug === targetCol?.slug || 
        String(t.college_code) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && t.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && t.branch_cd !== selectedBranchFilter) return false;
      if (selectedSubjectFilter !== 'all' && t.subject_code !== selectedSubjectFilter && t.subject_id !== selectedSubjectFilter) return false;
      if (selectedUnitFilter !== 'all' && t.unit_code !== selectedUnitFilter && t.unit_id !== selectedUnitFilter) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, selectedSubjectFilter, selectedUnitFilter, topics, colleges]);

  const filteredList = getFilteredItemsList().filter((item: any) => {
    if (!isMatchCollege(item)) return false;

    // Filter by Course
    if (selectedCourseFilter !== 'all') {
      const itemCourse = item.course_cd || item.course_code;
      if (!itemCourse || String(itemCourse) !== String(selectedCourseFilter)) return false;
    }

    // Filter by Branch
    if (selectedBranchFilter !== 'all') {
      const itemBranch = item.branch_cd || item.department_id || (activeTab === 'departments' ? (item.branch_cd || item.code) : null);
      if (!itemBranch || String(itemBranch) !== String(selectedBranchFilter)) return false;
    }

    // Filter by Subject
    if (selectedSubjectFilter !== 'all') {
      const isSubMatch = (item.subject_code && String(item.subject_code) === String(selectedSubjectFilter)) ||
                         (item.subject_id && String(item.subject_id) === String(selectedSubjectFilter)) ||
                         (activeTab === 'subjects' && (String(item.code) === String(selectedSubjectFilter) || String(item.id) === String(selectedSubjectFilter)));
      if (!isSubMatch) return false;
    }

    // Filter by Unit
    if (selectedUnitFilter !== 'all') {
      const isUnitMatch = (item.unit_code && String(item.unit_code) === String(selectedUnitFilter)) ||
                          (item.unit_id && String(item.unit_id) === String(selectedUnitFilter)) ||
                          (activeTab === 'units' && (String(item.code) === String(selectedUnitFilter) || String(item.id) === String(selectedUnitFilter)));
      if (!isUnitMatch) return false;
    }

    // Filter by Topic (for Competencies / Sub-Topics & Topics)
    if (selectedTopicFilter !== 'all') {
      const isTopicMatch = (item.topic_code && String(item.topic_code) === String(selectedTopicFilter)) ||
                           (item.topic_id && String(item.topic_id) === String(selectedTopicFilter)) ||
                           (activeTab === 'topics' && (String(item.code) === String(selectedTopicFilter) || String(item.id) === String(selectedTopicFilter)));
      if (!isTopicMatch) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.subject_name && item.subject_name.toLowerCase().includes(term)) ||
      (item.college_name && item.college_name.toLowerCase().includes(term))
    );
  });

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const modalDepartments = useMemo(() => {
    const targetColId = formData.college_id;
    const targetColSlug = formData.college_slug || colleges.find(c => c.id === targetColId)?.slug;
    if (!targetColId && !targetColSlug) return departments;
    return departments.filter(d => (targetColId && d.college_id === targetColId) || (targetColSlug && d.college_slug === targetColSlug));
  }, [formData.college_id, formData.college_slug, departments, colleges]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="AdminMaster — Academic Structure & Subject Mapping" />
        <main className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveTab(cat.key as SubCategory); setSearchTerm(''); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left border ${
                  activeTab === cat.key
                    ? 'bg-[#2D2575] text-white shadow-md border-[#2D2575] relative after:absolute after:left-3 after:bottom-1 after:w-5 after:h-[2px] after:bg-[#F36C21]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate text-[11px] font-bold">{cat.label.split('. ')[1]}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${
                  activeTab === cat.key
                    ? 'bg-white/20 text-white border-transparent'
                    : 'bg-slate-100 dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {syncMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <span>{syncMessage}</span>
              <button onClick={() => setSyncMessage('')} className="text-emerald-600 font-bold hover:underline">✕</button>
            </div>
          )}

          {/* Top Filter Bar with Cascading College -> Course -> Branch -> Subject */}
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. College Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🏛️</span> College:</span>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => handleCollegeFilterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
                >
                  <option value="all">All Colleges ({colleges.length})</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.code || col.id}>[#{col.code || '1'}] {col.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Course Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🎓</span> Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => {
                    setSelectedCourseFilter(e.target.value);
                    setSelectedBranchFilter('all');
                    setSelectedSubjectFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[170px] truncate"
                >
                  <option value="all">All Courses ({availableFilterCourses.length})</option>
                  {availableFilterCourses.map((crs: any) => (
                    <option key={crs.id || crs.code} value={crs.course_cd || crs.code}>[#{crs.course_cd || crs.code}] {crs.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Branch / Department Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🏢</span> Branch:</span>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => {
                    setSelectedBranchFilter(e.target.value);
                    setSelectedSubjectFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[170px] truncate"
                >
                  <option value="all">All Branches ({availableFilterBranches.length})</option>
                  {availableFilterBranches.map((br: any) => (
                    <option key={br.id} value={br.branch_cd || br.code}>[#{br.branch_cd || br.code}] {br.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. Subject Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📚</span> Subject:</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => {
                    setSelectedSubjectFilter(e.target.value);
                    setSelectedUnitFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
                >
                  <option value="all">All Subjects ({availableFilterSubjects.length})</option>
                  {availableFilterSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.code || sub.id}>[#{sub.code || 'N/A'}] {sub.name}</option>
                  ))}
                </select>
              </div>

              {/* 5. Unit Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📑</span> Unit:</span>
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => {
                    setSelectedUnitFilter(e.target.value);
                    setSelectedTopicFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="all">All Units ({availableFilterUnits.length})</option>
                  {availableFilterUnits.map((u: any) => (
                    <option key={u.id} value={u.code || u.id}>[#{u.code}] {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 20) : u.code)}</option>
                  ))}
                </select>
              </div>

              {/* 6. Topic Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📌</span> Topic:</span>
                <select
                  value={selectedTopicFilter}
                  onChange={(e) => {
                    setSelectedTopicFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="all">All Topics ({availableFilterTopics.length})</option>
                  {availableFilterTopics.map((t: any) => (
                    <option key={t.id} value={t.code || t.id}>[#{t.code}] {t.name ? t.name.slice(0, 25) : t.code}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder={`Search in ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#5B4BFF] transition-all"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                {activeTab === 'departments' && (
                  <button onClick={syncDepartmentsFromPortal} disabled={syncing} className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95">
                    <span className={syncing ? 'animate-spin' : ''}>🌐</span>
                    <span>{syncing ? 'Syncing...' : 'Sync SRMS'}</span>
                  </button>
                )}
                <button onClick={handleAddNew} className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  <span>Add New</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4 pl-5">Code</th>
                      <th className="p-4">Mapped College</th>
                      <th className="p-4">Course / Specialty</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Classification</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <TableSkeleton colCount={7} />
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'departments' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Code</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Course / Specialty</th>
                        <th className="p-4">Department Name</th>
                        <th className="p-4">Classification Type</th>
                        <th className="p-4">HOD Assigned</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-500 font-semibold">
                            No departments found for the selected college filter. Click &apos;Sync SRMS Departments&apos; or &apos;Add New Department&apos;.
                          </td>
                        </tr>
                      ) : (
                        paginatedList.map((d: any) => {
                          const col = colleges.find(c => c.id === d.college_id || c.slug === d.college_slug);
                          const colName = col?.name || d.college_name || 'SRMS Institution';
                          const colCode = col?.code || d.college_code || '';

                          return (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 whitespace-nowrap">
                                <span className="font-extrabold font-mono text-[#5B4BFF] dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                                  #{d.branch_cd || d.code}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-purple-600 dark:text-purple-300 font-bold font-mono">
                                {d.course_name || d.course_cd ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                                    🎓 {d.course_name || `Course #${d.course_cd}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal italic text-[10px]">General / Pre-Clinical</span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {d.name}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700">
                                  {d.type || 'General'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {d.hod_email ? (
                                  <code className="text-[#5B4BFF] font-mono text-[11px] font-bold">{d.hod_email}</code>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Unassigned</span>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${d.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {d.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(d)} onDelete={() => handleDelete(d.id, d.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subjects' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Subject Code</th>
                        <th className="p-4">Subject Name</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Longitudinal?</th>
                        <th className="p-4">Credits / Units</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-500 font-semibold">
                            No academic subjects found for the selected college filter. Click &apos;Add New Subject&apos; to create one on behalf of a department.
                          </td>
                        </tr>
                      ) : (
                        paginatedList.map((s: any) => {
                          const col = colleges.find(c => c.id === s.college_id || c.slug === s.college_slug);
                          const colName = col?.name || s.college_name || 'SRMS Institution';
                          const colCode = col?.code || s.college_code || '';

                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] dark:text-indigo-400 font-mono whitespace-nowrap">
                                <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                                  {s.code}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {s.name}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {s.department_name ? (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                                    🏢 {s.department_name} {s.branch_cd || s.department_code ? `(#${s.branch_cd || s.department_code})` : ''} {s.course_name ? `— 🎓 {s.course_name}` : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">General Department</span>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {s.is_longitudinal || s.code === 'CM' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    YES
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-mono font-bold text-[#5B4BFF] dark:text-indigo-400 whitespace-nowrap">
                                {s.credits || 4} Credits
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${s.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {s.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(s)} onDelete={() => handleDelete(s.id, s.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'professional-linkers' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">SNo</th>
                        <th className="p-4">Guideline Code</th>
                        <th className="p-4">Guideline Name</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Academic Session</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No Academic Guidelines defined in tenant schema. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((l: any, idx: number) => {
                          const col = colleges.find(c => c.id === l.college_id || c.slug === l.college_slug || c.code === l.college_code);
                          const colName = col?.name || l.college_name || 'SRMS Institution';
                          const colCode = col?.code || l.college_code || '';

                          return (
                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-bold">{startIndex + idx + 1}</td>
                              <td className="p-4 font-extrabold text-[#5B4BFF] font-mono">{l.code}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white">{l.name}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-1">{l.description || 'No additional details'}</div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">{l.academic_session || 'N/A'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${l.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {l.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right">
                                <ActionButtons onEdit={() => handleEdit(l)} onDelete={() => handleDelete(l.id, l.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subject-offerings' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Subject</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Course & Branch</th>
                        <th className="p-4">Academic Year / Phase</th>
                        <th className="p-4">Delivery Type</th>
                        <th className="p-4">Batch Year</th>
                        <th className="p-4">Hours Allotted</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-slate-500 font-medium">No subject offerings configured. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((o: any) => {
                          const col = colleges.find(c => c.id === o.college_id || c.slug === o.college_slug || c.code === o.college_code);
                          const colName = col?.name || o.college_name || 'SRMS Institution';
                          const colCode = col?.code || o.college_code || '';

                          return (
                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                                <div className="font-bold text-slate-900 dark:text-white">{o.subject_name || 'Subject'}</div>
                                <div className="text-[#5B4BFF] font-mono text-[11px]">Code: {o.subject_code || 'N/A'}</div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  🎓 {o.course_name || (o.course_cd ? `Course #${o.course_cd}` : 'General Course')}
                                </div>
                                {o.branch_cd && (
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    🏢 Branch: #{o.branch_cd}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">
                                {o.prof_name || 'Academic Phase'}
                                {o.academic_year ? <span className="text-[10px] text-slate-500 block font-normal">Year {o.academic_year}</span> : null}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                                  {o.dtype_code} ({o.dtype_name})
                                </span>
                              </td>
                              <td className="p-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                {o.batch_year} Admission
                              </td>
                              <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-bold">
                                {o.hours_allotted} hrs
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(o)} onDelete={() => handleDelete(o.id, o.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'delivery-types' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Code</th>
                        <th className="p-4">Delivery Type Name</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No delivery types registered. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((dt: any) => (
                          <tr key={dt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{dt.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{dt.name}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${dt.is_active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                                {dt.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(dt)} onDelete={() => handleDelete(dt.id, dt.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'units' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Unit Code & Order</th>
                        <th className="p-4">Unit Description / Title</th>
                        <th className="p-4">Bloom&apos;s Knowledge Level (KL)</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No units registered matching the selected filter. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                              <div className="font-extrabold text-[#5B4BFF] font-mono text-sm">{u.code}</div>
                              <div className="text-[11px] text-slate-500 font-mono">Order: #{u.unit_order || 1}</div>
                            </td>
                            <td className="p-4">
                              {u.name && u.name !== u.code && (
                                <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">{u.name}</div>
                              )}
                              <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-xl">
                                {u.description || 'No description provided.'}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-sm">
                                <span>🧠</span>
                                {u.bloom_level || 'KL-2 (Understand)'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                              {u.hours ? `${u.hours} hrs` : '—'}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${u.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                {u.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right whitespace-nowrap">
                              <ActionButtons onEdit={() => handleEdit(u)} onDelete={() => handleDelete(u.id, u.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'topics' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Topic Code</th>
                        <th className="p-4">Topic Title / Description</th>
                        <th className="p-4">Mapped Unit</th>
                        <th className="p-4">Bloom&apos;s Knowledge Level (KL)</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No curriculum topics registered matching the selected filter. Click &apos;Add New&apos; to start.</td></tr>
                      ) : (
                        paginatedList.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                              <div className="font-extrabold text-[#5B4BFF] font-mono text-sm">{t.code}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">{t.name}</div>
                              {t.description && (
                                <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-xl line-clamp-2">
                                  {t.description}
                                </div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {t.unit_code ? (
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 w-fit">
                                  <span>📑</span>
                                  {t.unit_code} {t.unit_name && t.unit_name !== t.unit_code ? `(${t.unit_name})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">General Topic</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-sm">
                                <span>🧠</span>
                                {t.bloom_level || t.unit_bloom_level || 'KL-2 (Understand)'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                              {t.hours} hrs
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${t.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                {t.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right whitespace-nowrap">
                              <ActionButtons onEdit={() => handleEdit(t)} onDelete={() => handleDelete(t.id, t.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'competencies' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Sub-Topic Code</th>
                        <th className="p-4">Sub-Topic Description / Title</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Unit</th>
                        <th className="p-4">Topic (Description)</th>
                        <th className="p-4">Bloom&apos;s Level</th>
                        <th className="p-4">Mastery / Core</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-medium">No competencies / sub-topics registered matching the selected filter. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 whitespace-nowrap">
                              <span className="font-extrabold text-[#5B4BFF] font-mono text-xs bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm inline-block">
                                {c.code}
                              </span>
                            </td>
                            <td className="p-4">
                              {c.name && <div className="font-extrabold text-slate-900 dark:text-white text-xs mb-0.5">{c.name}</div>}
                              <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-md">
                                {c.description}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                <span>📚</span> {c.subject_name || c.subject_code || 'General Subject'}
                              </div>
                              {c.subject_code && (
                                <div className="text-[11px] text-slate-500 font-mono">Code: #{c.subject_code}</div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {c.unit_code ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800 inline-block">
                                  📑 {c.unit_code} {c.unit_name && c.unit_name !== c.unit_code ? `(${c.unit_name})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {c.topic_name ? (
                                <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                  <span>📌</span> {c.topic_name}
                                </div>
                              ) : c.topic_code ? (
                                <div className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                  📌 [{c.topic_code}]
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">General Topic</span>
                              )}
                              {c.topic_description && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 max-w-xs mt-0.5">
                                  {c.topic_description}
                                </div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1 shadow-sm">
                                <span>🧠</span>
                                {c.domain || 'Knowledge'} • {c.bloom_level || 'KL-2'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">{c.level || 'Knows How'}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  c.is_core ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {c.is_core ? '⭐ CORE' : 'OPT'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${c.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                {c.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right whitespace-nowrap">
                              <ActionButtons onEdit={() => handleEdit(c)} onDelete={() => handleDelete(c.id, c.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {totalItems > 0 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div>
                      Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#5B4BFF] border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-all font-bold"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              currentPage === pg
                                ? 'bg-[#5B4BFF] text-white font-bold'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pg}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#5B4BFF] border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-all font-bold"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Popup Form Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full ${activeTab === 'competencies' || activeTab === 'topics' || activeTab === 'units' || activeTab === 'subject-offerings' ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#F6F8FC] dark:bg-slate-800/60 shrink-0">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>{categories.find(c => c.key === activeTab)?.icon}</span>
                    <span>{editingItem ? `Edit ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}` : `Create New ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}`}</span>
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 text-lg font-bold px-2 py-0.5 rounded transition-colors">✕</button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-3 text-xs font-medium overflow-y-auto flex-1">
                  {/* Form fields for Departments */}
                  {activeTab === 'departments' && (() => {
                    const colCourses = getCoursesForCollege(formData.college_id || formData.college_slug);
                    return (
                      <>
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{colleges.find(c => c.id === formData.college_id || c.slug === formData.college_slug || c.code === formData.college_id)?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={
                              colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_id)?.code ||
                              formData.college_id ||
                              colleges[0]?.code ||
                              colleges[0]?.id
                            }
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const newCourses = getCoursesForCollege(newColCd);
                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: newCourses[0]?.course_cd || newCourses[0]?.code || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Map to Course *</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              course_cd: #{colCourses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd)?.course_cd || formData.course_cd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={formData.course_cd || ''}
                            onChange={(e) => setFormData({ ...formData, course_cd: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colCourses.length === 0 ? (
                              <option value="">-- No Courses Found for this College --</option>
                            ) : (
                              colCourses.map((crs: any) => (
                                <option key={crs.id} value={crs.course_cd || crs.code || crs.id}>
                                  🎓 {crs.name} (Code: #{crs.course_cd || crs.code})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Code (branch_cd) *</label>
                            <input
                              type="text"
                              required
                              value={formData.code || formData.branch_cd || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value, branch_cd: e.target.value })}
                              placeholder="e.g. 1, 2, 3"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classification Type *</label>
                            <select
                              required
                              value={formData.type || 'General'}
                              onChange={e => setFormData({ ...formData, type: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="General">General / Core Discipline</option>
                              <option value="Engineering">Engineering & Technology</option>
                              <option value="Pharmacy">Pharmacy Sciences</option>
                              <option value="Management">Management Studies</option>
                              <option value="Law">Legal Studies</option>
                              <option value="Pre-Clinical">Pre-Clinical (Anatomy, Physiology, Biochemistry)</option>
                              <option value="Para-Clinical">Para-Clinical (Pathology, Pharmacology, Microbiology)</option>
                              <option value="Clinical">Clinical Specialties (Medicine, Surgery, Pediatrics)</option>
                              <option value="Administrative">Administrative / Support</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department / Branch Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. (CSE) / BCA Department / Department of Anatomy"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Subjects (With College & Cascading Course -> Branch/Department Selection) */}
                  {activeTab === 'subjects' && (() => {
                    const colCourses = getCoursesForCollege(formData.college_id || formData.college_slug);
                    const selectedCourseCd = formData.course_cd || colCourses[0]?.course_cd || colCourses[0]?.code || '';
                    const colDepts = departments.filter(d => {
                      const matchCol = isMatchCollege(d) || d.college_id === formData.college_id || d.college_slug === formData.college_slug || String(d.colg_cd) === String(formData.college_id);
                      if (!matchCol) return false;
                      if (!selectedCourseCd) return true;
                      return (
                        d.course_cd === selectedCourseCd ||
                        d.course_code === selectedCourseCd ||
                        (d.course_name && colCourses.find(c => c.course_cd === selectedCourseCd || c.code === selectedCourseCd)?.name?.toLowerCase() === d.course_name?.toLowerCase())
                      );
                    });

                    return (
                      <>
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={
                              colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code ||
                              formData.college_id ||
                              colleges[0]?.code ||
                              colleges[0]?.id
                            }
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const newCourses = getCoursesForCollege(newColCd);
                              const firstCourseCd = newCourses[0]?.course_cd || newCourses[0]?.code || '';
                              const newDepts = departments.filter(d => (d.college_id === newColCd || d.college_slug === newCol?.slug) && (!firstCourseCd || d.course_cd === firstCourseCd));
                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                department_id: newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Map to Course *</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCrsCd = e.target.value;
                              const newDepts = departments.filter(d => (d.college_id === formData.college_id || d.college_slug === formData.college_slug) && (d.course_cd === newCrsCd || d.course_code === newCrsCd));
                              setFormData({
                                ...formData,
                                course_cd: newCrsCd,
                                department_id: newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colCourses.length === 0 ? (
                              <option value="">-- No Courses Found for this College --</option>
                            ) : (
                              colCourses.map((crs: any) => (
                                <option key={crs.id} value={crs.course_cd || crs.code || crs.id}>
                                  🎓 {crs.name} (Code: #{crs.course_cd || crs.code})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 3: Select Department / Branch *
                          </label>
                          <select
                            required
                            value={formData.department_id || ''}
                            onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="">-- Choose Department / Branch for Subject --</option>
                            {colDepts.map(d => (
                              <option key={d.id} value={d.branch_cd || d.code || d.id}>
                                🏢 {d.name} (Code: #{d.branch_cd || d.code}){d.course_name ? ` — ${d.course_name}` : ''}
                              </option>
                            ))}
                          </select>
                          {colDepts.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1">
                              ⚠️ No department/branch mapped to this course yet.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Code *</label>
                            <input
                              type="text"
                              required
                              value={formData.code || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              placeholder="e.g. CS101, ANAT-101"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Credits / Units</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.credits || 4}
                              onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Human Anatomy & Histology, Data Structures"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Is Longitudinal Subject? *</label>
                          <select
                            required
                            value={formData.is_longitudinal ? 'true' : 'false'}
                            onChange={e => setFormData({ ...formData, is_longitudinal: e.target.value === 'true' })}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="false">No (Standard Phase-Bound / Semester Subject)</option>
                            <option value="true">Yes (Longitudinal Subject runs across multiple phases)</option>
                          </select>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for ProfessionalLinker */}
                  {activeTab === 'professional-linkers' && (
                    <>
                      <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                          <span>Select College *</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                            colg_cd: #{colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code || '1'}
                          </span>
                        </label>
                        <select
                          required
                          value={
                            colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code ||
                            formData.college_id ||
                            colleges[0]?.code ||
                            colleges[0]?.id
                          }
                          onChange={(e) => {
                            const newColCd = e.target.value;
                            const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                            setFormData({
                              ...formData,
                              college_id: newCol?.code || newCol?.id || newColCd,
                              college_slug: newCol?.slug || '',
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        >
                          {colleges.map(c => (
                            <option key={c.id} value={c.code || c.id}>
                              🏛️ {c.name} ({c.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guideline Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. 2026, GUIDE-01" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                          <input type="text" value={formData.course_cd || ''} onChange={e => setFormData({ ...formData, course_cd: e.target.value })} placeholder="e.g. MBBS, BTECH, BCA" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guideline Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 2026 Academic Guidelines / Phase I Curriculum" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Phase / Year</label>
                          <input type="text" value={formData.professional_phase || ''} onChange={e => setFormData({ ...formData, professional_phase: e.target.value })} placeholder="e.g. 2026 / 1st Professional" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Session</label>
                          <input type="text" value={formData.academic_session || ''} onChange={e => setFormData({ ...formData, academic_session: e.target.value })} placeholder="2026-2027" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guidelines Description</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Curricular guidelines, module linking, and regulations..." className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"></textarea>
                      </div>
                    </>
                  )}

                  {/* Form fields for Subject Offerings */}
                  {activeTab === 'subject-offerings' && (() => {
                    const currentCollege = colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(formData.college_id || formData.college_slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || formData.department_id || availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug || String(s.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    const availablePhases = profPhases.filter(p => {
                      const isColMatch = !currentCollege || p.college_id === currentCollege.id || p.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || p.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || !p.branch_cd || p.branch_cd === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });

                    return (
                      <>
                        {/* 1. Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d => 
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === newCol?.id || s.college_slug === newCol?.slug) &&
                                (!firstCourseCd || s.course_cd === firstCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d => 
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!newCourseCd || s.course_cd === newCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!selectedCourseCd || s.course_cd === selectedCourseCd) &&
                                (!newBranchCd || s.branch_cd === newBranchCd || s.department_id === newBranchCd)
                              );
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">🏢 Default Course Department (Code: #1)</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `${selectedCourseCd} Department`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* 4. Select Subject */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 4: Select Subject * ({availableSubjects.length} available)
                          </label>
                          <select
                            required
                            value={subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id || ''}
                            onChange={e => {
                              const val = e.target.value;
                              const found = availableSubjects.find(s => s.code === val || s.id === val);
                              setFormData({
                                ...formData,
                                subject_id: found?.code || found?.id || val,
                                _resolved_subject_id: found?.id,
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="">-- Choose Subject for Offering --</option>
                            {availableSubjects.map(s => (
                              <option key={s.id} value={s.code || s.id}>
                                📚 {s.name} (Code: #{s.code || 'N/A'}, {s.credits || 4} Credits)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 5. Select Batch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 5: Select Batch *
                            </label>
                            <select
                              value={batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === formData.batch_id || String(b.year) === formData.batch_id)?.batch_cd || batches.find(b => b.id === formData.batch_id)?.year || formData.batch_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const selectedB = availableBatches.find(b => String(b.batch_cd) === val || String(b.year) === val || b.code === val || b.id === val);
                                setFormData({
                                  ...formData,
                                  batch_id: selectedB?.batch_cd || selectedB?.year || selectedB?.id || val,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: selectedB?.year || formData.batch_year || 2024,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year *
                            </label>
                            <input
                              type="number"
                              required
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* 6. Academic Year / Semester / Phase & Delivery Type */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 6: Academic Year / Semester / Phase *
                            </label>
                            <select
                              required
                              value={profPhases.find(p => p.id === formData.prof_id || String(p.phase_order) === formData.prof_id)?.phase_order || formData.prof_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = (availablePhases.length > 0 ? availablePhases : profPhases).find(p => String(p.phase_order) === val || p.id === val);
                                setFormData({
                                  ...formData,
                                  prof_id: found?.phase_order || found?.id || val,
                                  _resolved_prof_id: found?.id,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Academic Phase / Sem --</option>
                              {(availablePhases.length > 0 ? availablePhases : profPhases).map(p => (
                                <option key={p.id} value={p.phase_order || p.code || p.id}>
                                  📖 {p.academic_year ? `Year ${p.academic_year} — ` : ''}{p.name} {p.phase_order ? `(Order: #${p.phase_order})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 7: Delivery Type *
                            </label>
                            <select
                              required
                              value={deliveryTypes.find(dt => dt.id === formData.dtype_id || dt.code === formData.dtype_id)?.code || formData.dtype_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = deliveryTypes.find(dt => dt.code === val || dt.id === val);
                                setFormData({
                                  ...formData,
                                  dtype_id: found?.code || found?.id || val,
                                  _resolved_dtype_id: found?.id,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Delivery Type --</option>
                              {deliveryTypes.map(dt => (
                                <option key={dt.id} value={dt.code || dt.id}>
                                  {dt.name} ({dt.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 7. Hours Allotted */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 8: Hours Allotted *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            required
                            value={formData.hours_allotted ?? 100}
                            onChange={e => setFormData({ ...formData, hours_allotted: Number(e.target.value) })}
                            placeholder="e.g. 100"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Delivery Types */}
                  {activeTab === 'delivery-types' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. TH, PR" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                          <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Theory, Practical" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Units (With 5-Step Cascading Selectors & Bloom's KL) */}
                  {activeTab === 'units' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    return (
                      <>
                        {/* Step 1: Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d => 
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === newCol?.id || s.college_slug === newCol?.slug) &&
                                (!firstCourseCd || s.course_cd === firstCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.code || newSubjects[0]?.id || '',
                                subject_code: newSubjects[0]?.code || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d => 
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!newCourseCd || s.course_cd === newCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.code || newSubjects[0]?.id || '',
                                subject_code: newSubjects[0]?.code || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 3: Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!selectedCourseCd || s.course_cd === selectedCourseCd) &&
                                (!newBranchCd || s.branch_cd === newBranchCd || s.department_id === newBranchCd)
                              );
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: newSubjects[0]?.code || newSubjects[0]?.id || '',
                                subject_code: newSubjects[0]?.code || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">🏢 Default Course Department (Code: #1)</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `${selectedCourseCd} Department`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* Step 4: Select Batch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 4: Select Batch *
                            </label>
                            <select
                              value={batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === formData.batch_id || String(b.year) === formData.batch_id)?.batch_cd || batches.find(b => b.id === formData.batch_id)?.year || formData.batch_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const selectedB = availableBatches.find(b => String(b.batch_cd) === val || String(b.year) === val || b.code === val || b.id === val);
                                setFormData({
                                  ...formData,
                                  batch_id: selectedB?.batch_cd || selectedB?.year || selectedB?.id || val,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: selectedB?.year || formData.batch_year || 2024,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year
                            </label>
                            <input
                              type="number"
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Step 5: Select Subject */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 5: Select Subject * ({availableSubjects.length} available)
                          </label>
                          <select
                            required
                            value={subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id || ''}
                            onChange={e => {
                              const val = e.target.value;
                              const found = availableSubjects.find(s => s.code === val || s.id === val);
                              setFormData({
                                ...formData,
                                subject_id: found?.code || found?.id || val,
                                subject_code: found?.code || '',
                                _resolved_subject_id: found?.id,
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="">-- Choose Subject for Unit --</option>
                            {availableSubjects.map(s => (
                              <option key={s.id} value={s.code || s.id}>
                                📚 {s.name} (Code: #{s.code || 'N/A'}, {s.credits || 4} Credits)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Unit Code & Bloom's Level */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Code *</label>
                            <input
                              type="text"
                              required
                              value={formData.code || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              placeholder="e.g. UNIT-1 / U1 / UNIT-01"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bloom&apos;s Knowledge Level (KL) *</label>
                            <select
                              required
                              value={formData.bloom_level || 'KL-2 (Understand)'}
                              onChange={e => setFormData({ ...formData, bloom_level: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="KL-1 (Remember)">KL-1 (Remember) — Recall facts & basic concepts</option>
                              <option value="KL-2 (Understand)">KL-2 (Understand) — Explain ideas or concepts</option>
                              <option value="KL-3 (Apply)">KL-3 (Apply) — Use information in new situations</option>
                              <option value="KL-4 (Analyze)">KL-4 (Analyze) — Draw connections among ideas</option>
                              <option value="KL-5 (Evaluate)">KL-5 (Evaluate) — Justify a stand or decision</option>
                              <option value="KL-6 (Create)">KL-6 (Create) — Produce new or original work</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Description / Syllabus Content *</label>
                          <textarea
                            rows={3}
                            required
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide comprehensive topics and unit syllabus content..."
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Sequence Order</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.unit_order || 1}
                              onChange={e => setFormData({ ...formData, unit_order: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Allocated Hours</label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={formData.hours || 10}
                              onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Topics (Compact Multi-Column Grid Layout) */}
                  {activeTab === 'topics' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });
                    const selectedSubCode = formData.subject_code || formData.subject_id || availableSubjects[0]?.code || '';

                    const availableUnits = units.filter(u => {
                      const isColMatch = !currentCollege || u.college_id === currentCollege.id || u.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || u.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || u.branch_cd === selectedBranchCd;
                      const isSubMatch = !selectedSubCode || u.subject_code === selectedSubCode || u.subject_id === selectedSubCode;
                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch;
                    });
                    const selectedUnitCode = formData.unit_code || formData.unit_id || availableUnits[0]?.code || '';

                    return (
                      <>
                        {/* Row 1: 4-Column Header Ribbon (College, Course, Branch, Subject) */}
                        <div className="grid grid-cols-4 gap-2 bg-[#F6F8FC] dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🏛️ 1. College *
                            </label>
                            <select
                              required
                              value={currentCollege?.code || currentCollege?.id || formData.college_id}
                              onChange={(e) => {
                                const newColCd = e.target.value;
                                const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                                const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                                const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                                const newDepts = departments.filter(d => 
                                  (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                  (!firstCourseCd || d.course_cd === firstCourseCd)
                                );
                                const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === newCol?.id || s.college_slug === newCol?.slug) &&
                                  (!firstCourseCd || s.course_cd === firstCourseCd) &&
                                  (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === newCol?.id || u.college_slug === newCol?.slug) &&
                                  (!firstCourseCd || u.course_cd === firstCourseCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const autoCode = `${firstSubCode ? firstSubCode + '-' : ''}${firstUnit?.code ? firstUnit.code.replace('UNIT-', 'U') + '-' : ''}T${String(topics.length + 1).padStart(2, '0')}`;

                                setFormData({
                                  ...formData,
                                  college_id: newCol?.code || newCol?.id || newColCd,
                                  college_slug: newCol?.slug || '',
                                  course_cd: firstCourseCd,
                                  branch_cd: firstBranchCd,
                                  department_id: firstBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  bloom_level: firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {colleges.map(c => (
                                <option key={c.id} value={c.code || c.id}>{c.name} ({c.code})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🎓 2. Course *
                            </label>
                            <select
                              required
                              value={selectedCourseCd}
                              onChange={(e) => {
                                const newCourseCd = e.target.value;
                                const newDepts = departments.filter(d => 
                                  (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                  (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                                );
                                const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                  (!newCourseCd || s.course_cd === newCourseCd) &&
                                  (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!newCourseCd || u.course_cd === newCourseCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const autoCode = `${firstSubCode ? firstSubCode + '-' : ''}${firstUnit?.code ? firstUnit.code.replace('UNIT-', 'U') + '-' : ''}T${String(topics.length + 1).padStart(2, '0')}`;

                                setFormData({
                                  ...formData,
                                  course_cd: newCourseCd,
                                  branch_cd: firstBranchCd,
                                  department_id: firstBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  bloom_level: firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {availableCourses.map(c => (
                                <option key={c.id || c.code} value={c.course_cd || c.code}>{c.name} (#{c.course_cd || c.code})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🏢 3. Branch *
                            </label>
                            <select
                              required
                              value={selectedBranchCd}
                              onChange={(e) => {
                                const newBranchCd = e.target.value;
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || s.course_cd === selectedCourseCd) &&
                                  (!newBranchCd || s.branch_cd === newBranchCd || s.department_id === newBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || u.course_cd === selectedCourseCd) &&
                                  (!newBranchCd || u.branch_cd === newBranchCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const autoCode = `${firstSubCode ? firstSubCode + '-' : ''}${firstUnit?.code ? firstUnit.code.replace('UNIT-', 'U') + '-' : ''}T${String(topics.length + 1).padStart(2, '0')}`;

                                setFormData({
                                  ...formData,
                                  branch_cd: newBranchCd,
                                  department_id: newBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  bloom_level: firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {availableDepts.length === 0 ? (
                                <option value="1">Dept #1</option>
                              ) : (
                                availableDepts.map(d => {
                                  const displayCode = d.branch_cd || d.code || '1';
                                  const displayName = (d.name && d.name !== '-') ? d.name : `Dept ${displayCode}`;
                                  return (
                                    <option key={d.id} value={displayCode}>{displayName} (#{displayCode})</option>
                                  );
                                })
                              )}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              📚 4. Subject *
                            </label>
                            <select
                              required
                              value={subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableSubjects.find(s => s.code === val || s.id === val);
                                const subCode = found?.code || val;
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || u.course_cd === selectedCourseCd) &&
                                  (!subCode || u.subject_code === subCode)
                                );
                                const firstUnit = newUnits[0];
                                const autoCode = `${subCode ? subCode + '-' : ''}${firstUnit?.code ? firstUnit.code.replace('UNIT-', 'U') + '-' : ''}T${String(topics.length + 1).padStart(2, '0')}`;

                                setFormData({
                                  ...formData,
                                  subject_id: found?.code || found?.id || val,
                                  subject_code: found?.code || '',
                                  _resolved_subject_id: found?.id,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  bloom_level: firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              <option value="">-- Choose Subject --</option>
                              {availableSubjects.map(s => (
                                <option key={s.id} value={s.code || s.id}>[#{s.code || 'N/A'}] {s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Unit, Topic Code (Auto), Bloom's Level */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              📑 5. Select Unit *
                            </label>
                            <select
                              required
                              value={units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableUnits.find(u => u.code === val || u.id === val);
                                const unitCode = found?.code || val;
                                const subCode = formData.subject_code || formData.subject_id || '';
                                const autoCode = `${subCode ? subCode + '-' : ''}${unitCode ? unitCode.replace('UNIT-', 'U') + '-' : ''}T${String(topics.length + 1).padStart(2, '0')}`;

                                setFormData({
                                  ...formData,
                                  unit_id: found?.code || found?.id || val,
                                  unit_code: found?.code || '',
                                  _resolved_unit_id: found?.id,
                                  bloom_level: found?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoCode,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Unit --</option>
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.code || u.id}>
                                  📑 {u.code} — {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 20) : u.code)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Code (Auto) *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.code || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              placeholder="e.g. 88534-U1-T01"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Bloom&apos;s Knowledge Level *
                            </label>
                            <select
                              required
                              value={formData.bloom_level || 'KL-2 (Understand)'}
                              onChange={e => setFormData({ ...formData, bloom_level: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="KL-1 (Remember)">KL-1 (Remember)</option>
                              <option value="KL-2 (Understand)">KL-2 (Understand)</option>
                              <option value="KL-3 (Apply)">KL-3 (Apply)</option>
                              <option value="KL-4 (Analyze)">KL-4 (Analyze)</option>
                              <option value="KL-5 (Evaluate)">KL-5 (Evaluate)</option>
                              <option value="KL-6 (Create)">KL-6 (Create)</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 3: Topic Title (col-span-2), Allocated Hours (col-span-1) */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Title / Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name || ''}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Introduction to HTML5 and Web Standards"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Allocated Hours
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.hours || 2}
                              onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Row 4: Topic Description (col-span-2), Linked Guideline (col-span-1) */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Description / Syllabus Details
                            </label>
                            <textarea
                              rows={2}
                              value={formData.description || ''}
                              onChange={e => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Provide details about syllabus coverage, milestones, key concepts..."
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Linked Guideline (Optional)
                            </label>
                            <select
                              value={linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id)?.code || formData.linker_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = linkers.find(l => l.code === val || l.id === val);
                                setFormData({ ...formData, linker_id: found?.code || found?.id || val, _resolved_linker_id: found?.id });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Guideline --</option>
                              {linkers.map(l => (
                                <option key={l.id} value={l.code || l.id}>📋 {l.name} ({l.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Competencies / Sub-Topics (Compact Multi-Column Grid Layout & In-Modal Queue) */}
                  {activeTab === 'competencies' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });
                    const selectedSubCode = formData.subject_code || formData.subject_id || availableSubjects[0]?.code || '';

                    const availableUnits = units.filter(u => {
                      const isColMatch = !currentCollege || u.college_id === currentCollege.id || u.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || u.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || u.branch_cd === selectedBranchCd;
                      const isSubMatch = !selectedSubCode || u.subject_code === selectedSubCode || u.subject_id === selectedSubCode;
                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch;
                    });
                    const selectedUnitCode = formData.unit_code || formData.unit_id || availableUnits[0]?.code || '';

                    const availableTopics = topics.filter(t => {
                      const isColMatch = !currentCollege || t.college_id === currentCollege.id || t.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || t.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || t.branch_cd === selectedBranchCd;
                      const isSubMatch = !selectedSubCode || t.subject_code === selectedSubCode || t.subject_id === selectedSubCode;
                      const isUnitMatch = !selectedUnitCode || t.unit_code === selectedUnitCode || t.unit_id === selectedUnitCode;
                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch && isUnitMatch;
                    });
                    const selectedTopicCode = formData.topic_code || formData.topic_id || availableTopics[0]?.code || '';

                    // Check if current typed code already exists in this subject
                    const activeCheckCode = (subTopicCode || formData.code || '').trim().toUpperCase();
                    const codeExistsInSubject = activeCheckCode ? competencies.some(c => 
                      c.code?.toUpperCase() === activeCheckCode && 
                      (c.subject_code === selectedSubCode || c.subject_id === selectedSubCode || !selectedSubCode)
                    ) : false;

                    const handleAddSubTopicToQueue = () => {
                      const code = (subTopicCode || formData.code)?.trim().toUpperCase();
                      const desc = (subTopicDesc || formData.description)?.trim();
                      const name = (subTopicName || formData.name)?.trim();
                      if (!code) {
                        alert('Please enter a Sub-Topic / Competency Code');
                        return;
                      }
                      if (!desc) {
                        alert('Please enter a Competency Statement / Objective');
                        return;
                      }

                      if (tempCompetencies.some(it => it.code === code)) {
                        alert(`Sub-Topic code "${code}" is already in the queue.`);
                        return;
                      }

                      setTempCompetencies(prev => [
                        ...prev,
                        {
                          code,
                          name,
                          description: desc,
                          domain: subTopicDomain || formData.domain || 'Knowledge',
                          level: subTopicLevel || formData.level || 'Knows How',
                          bloom_level: subTopicBloom || formData.bloom_level || 'KL-2 (Understand)',
                          is_core: subTopicCore,
                        },
                      ]);

                      const nextSeq = String(tempCompetencies.length + 2).padStart(2, '0');
                      if (code.includes('-ST')) {
                        setSubTopicCode(`${code.split('-ST')[0]}-ST${nextSeq}`);
                      } else {
                        setSubTopicCode(`${code}-ST${nextSeq}`);
                      }
                      setSubTopicName('');
                      setSubTopicDesc('');
                    };

                    return (
                      <>
                        {/* Row 1: 4-Column Header Ribbon (College, Course, Branch, Subject) */}
                        <div className="grid grid-cols-4 gap-2 bg-[#F6F8FC] dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🏛️ 1. College *
                            </label>
                            <select
                              required
                              value={currentCollege?.code || currentCollege?.id || formData.college_id}
                              onChange={(e) => {
                                const newColCd = e.target.value;
                                const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                                const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                                const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                                const newDepts = departments.filter(d => 
                                  (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                  (!firstCourseCd || d.course_cd === firstCourseCd)
                                );
                                const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === newCol?.id || s.college_slug === newCol?.slug) &&
                                  (!firstCourseCd || s.course_cd === firstCourseCd) &&
                                  (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === newCol?.id || u.college_slug === newCol?.slug) &&
                                  (!firstCourseCd || u.course_cd === firstCourseCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const newTopics = topics.filter(t =>
                                  (t.college_id === newCol?.id || t.college_slug === newCol?.slug) &&
                                  (!firstCourseCd || t.course_cd === firstCourseCd) &&
                                  (!firstSubCode || t.subject_code === firstSubCode) &&
                                  (!firstUnit?.code || t.unit_code === firstUnit?.code)
                                );
                                const firstTopic = newTopics[0];
                                const autoSubCode = `${firstTopic?.code ? firstTopic.code + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  college_id: newCol?.code || newCol?.id || newColCd,
                                  college_slug: newCol?.slug || '',
                                  course_cd: firstCourseCd,
                                  branch_cd: firstBranchCd,
                                  department_id: firstBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  topic_id: firstTopic?.code || '',
                                  topic_code: firstTopic?.code || '',
                                  bloom_level: firstTopic?.bloom_level || firstUnit?.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {colleges.map(c => (
                                <option key={c.id} value={c.code || c.id}>{c.name} ({c.code})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🎓 2. Course *
                            </label>
                            <select
                              required
                              value={selectedCourseCd}
                              onChange={(e) => {
                                const newCourseCd = e.target.value;
                                const newDepts = departments.filter(d => 
                                  (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                  (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                                );
                                const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                  (!newCourseCd || s.course_cd === newCourseCd) &&
                                  (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!newCourseCd || u.course_cd === newCourseCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const newTopics = topics.filter(t =>
                                  (t.college_id === currentCollege?.id || t.college_slug === currentCollege?.slug) &&
                                  (!newCourseCd || t.course_cd === newCourseCd) &&
                                  (!firstSubCode || t.subject_code === firstSubCode) &&
                                  (!firstUnit?.code || t.unit_code === firstUnit?.code)
                                );
                                const firstTopic = newTopics[0];
                                const autoSubCode = `${firstTopic?.code ? firstTopic.code + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  course_cd: newCourseCd,
                                  branch_cd: firstBranchCd,
                                  department_id: firstBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  topic_id: firstTopic?.code || '',
                                  topic_code: firstTopic?.code || '',
                                  bloom_level: firstTopic?.bloom_level || firstUnit?.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {availableCourses.map(c => (
                                <option key={c.id || c.code} value={c.course_cd || c.code}>{c.name} (#{c.course_cd || c.code})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              🏢 3. Branch *
                            </label>
                            <select
                              required
                              value={selectedBranchCd}
                              onChange={(e) => {
                                const newBranchCd = e.target.value;
                                const newSubjects = subjects.filter(s =>
                                  (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || s.course_cd === selectedCourseCd) &&
                                  (!newBranchCd || s.branch_cd === newBranchCd || s.department_id === newBranchCd)
                                );
                                const firstSubCode = newSubjects[0]?.code || '';
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || u.course_cd === selectedCourseCd) &&
                                  (!newBranchCd || u.branch_cd === newBranchCd) &&
                                  (!firstSubCode || u.subject_code === firstSubCode)
                                );
                                const firstUnit = newUnits[0];
                                const newTopics = topics.filter(t =>
                                  (t.college_id === currentCollege?.id || t.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || t.course_cd === selectedCourseCd) &&
                                  (!newBranchCd || t.branch_cd === newBranchCd) &&
                                  (!firstSubCode || t.subject_code === firstSubCode || t.subject_id === firstSubCode) &&
                                  (!firstUnit?.code || t.unit_code === firstUnit?.code)
                                );
                                const firstTopic = newTopics[0];
                                const autoSubCode = `${firstTopic?.code ? firstTopic.code + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  branch_cd: newBranchCd,
                                  department_id: newBranchCd,
                                  subject_id: firstSubCode || newSubjects[0]?.id || '',
                                  subject_code: firstSubCode,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  topic_id: firstTopic?.code || '',
                                  topic_code: firstTopic?.code || '',
                                  bloom_level: firstTopic?.bloom_level || firstUnit?.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              {availableDepts.length === 0 ? (
                                <option value="1">Dept #1</option>
                              ) : (
                                availableDepts.map(d => {
                                  const displayCode = d.branch_cd || d.code || '1';
                                  const displayName = (d.name && d.name !== '-') ? d.name : `Dept ${displayCode}`;
                                  return (
                                    <option key={d.id} value={displayCode}>{displayName} (#{displayCode})</option>
                                  );
                                })
                              )}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] block truncate">
                              📚 4. Subject *
                            </label>
                            <select
                              required
                              value={subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableSubjects.find(s => s.code === val || s.id === val);
                                const subCode = found?.code || val;
                                const newUnits = units.filter(u =>
                                  (u.college_id === currentCollege?.id || u.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || u.course_cd === selectedCourseCd) &&
                                  (!subCode || u.subject_code === subCode)
                                );
                                const firstUnit = newUnits[0];
                                const newTopics = topics.filter(t =>
                                  (t.college_id === currentCollege?.id || t.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || t.course_cd === selectedCourseCd) &&
                                  (!subCode || t.subject_code === subCode) &&
                                  (!firstUnit?.code || t.unit_code === firstUnit?.code)
                                );
                                const firstTopic = newTopics[0];
                                const autoSubCode = `${firstTopic?.code ? firstTopic.code + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  subject_id: found?.code || found?.id || val,
                                  subject_code: found?.code || '',
                                  _resolved_subject_id: found?.id,
                                  unit_id: firstUnit?.code || '',
                                  unit_code: firstUnit?.code || '',
                                  topic_id: firstTopic?.code || '',
                                  topic_code: firstTopic?.code || '',
                                  bloom_level: firstTopic?.bloom_level || firstUnit?.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] truncate"
                            >
                              <option value="">-- Choose Subject --</option>
                              {availableSubjects.map(s => (
                                <option key={s.id} value={s.code || s.id}>[#{s.code || 'N/A'}] {s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: 3-Column Cascading (Unit, Topic, Linked Guideline) */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              📑 5. Select Unit * ({availableUnits.length} in subject)
                            </label>
                            <select
                              required
                              value={units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableUnits.find(u => u.code === val || u.id === val);
                                const unitCode = found?.code || val;
                                const subCode = formData.subject_code || formData.subject_id || '';
                                const newTopics = topics.filter(t =>
                                  (t.college_id === currentCollege?.id || t.college_slug === currentCollege?.slug) &&
                                  (!selectedCourseCd || t.course_cd === selectedCourseCd) &&
                                  (!subCode || t.subject_code === subCode) &&
                                  (!unitCode || t.unit_code === unitCode)
                                );
                                const firstTopic = newTopics[0];
                                const autoSubCode = `${firstTopic?.code ? firstTopic.code + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  unit_id: found?.code || found?.id || val,
                                  unit_code: found?.code || '',
                                  _resolved_unit_id: found?.id,
                                  topic_id: firstTopic?.code || '',
                                  topic_code: firstTopic?.code || '',
                                  bloom_level: firstTopic?.bloom_level || found?.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Unit --</option>
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.code || u.id}>
                                  📑 {u.code} — {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 20) : u.code)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              📌 6. Select Topic * ({availableTopics.length} in unit)
                            </label>
                            <select
                              required
                              value={topics.find(t => t.id === formData.topic_id || t.code === formData.topic_id)?.code || formData.topic_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableTopics.find(t => t.code === val || t.id === val);
                                const topicCode = found?.code || val;
                                const autoSubCode = `${topicCode ? topicCode + '-' : ''}ST01`;
                                setSubTopicCode(autoSubCode);

                                setFormData({
                                  ...formData,
                                  topic_id: found?.code || found?.id || val,
                                  topic_code: found?.code || '',
                                  _resolved_topic_id: found?.id,
                                  bloom_level: found?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: autoSubCode,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Topic --</option>
                              {availableTopics.map(t => (
                                <option key={t.id} value={t.code || t.id}>
                                  📌 [{t.code}] {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              📋 Linked Guideline
                            </label>
                            <select
                              value={linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id)?.code || formData.linker_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = linkers.find(l => l.code === val || l.id === val);
                                setFormData({ ...formData, linker_id: found?.code || found?.id || val, _resolved_linker_id: found?.id });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Guideline (Optional) --</option>
                              {linkers.map(l => (
                                <option key={l.id} value={l.code || l.id}>📋 {l.name} ({l.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Sub-Topic / Competency Entry Card */}
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-3.5 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                              <span>✨</span> Sub-Topic / Competency Details
                            </span>
                            <div className="flex items-center gap-2">
                              {activeCheckCode && (
                                codeExistsInSubject ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                    <span>⚠️</span> Code exists in subject
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span>✅</span> Code available
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Row 3: Code, Domain, Mastery, Core */}
                          <div className="grid grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Sub-Topic Code *
                              </label>
                              <input
                                type="text"
                                value={subTopicCode || formData.code || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSubTopicCode(val);
                                  setFormData({ ...formData, code: val });
                                }}
                                placeholder="e.g. ST01 / AN1.1"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Blooms Domain *
                              </label>
                              <select
                                value={subTopicDomain || formData.domain || 'Knowledge'}
                                onChange={e => {
                                  setSubTopicDomain(e.target.value);
                                  setFormData({ ...formData, domain: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              >
                                <option value="Knowledge">Knowledge (Cognitive)</option>
                                <option value="Skills">Skills (Psychomotor)</option>
                                <option value="Attitude">Attitude (Affective)</option>
                                <option value="Communication">Communication</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Mastery Level
                              </label>
                              <select
                                value={subTopicLevel || formData.level || 'Knows How'}
                                onChange={e => {
                                  setSubTopicLevel(e.target.value);
                                  setFormData({ ...formData, level: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              >
                                <option value="Knows">Knows (K)</option>
                                <option value="Knows How">Knows How (KH)</option>
                                <option value="Shows How">Shows How (SH)</option>
                                <option value="Performs">Performs (P)</option>
                              </select>
                            </div>

                            <div className="flex items-center pt-5">
                              <label className="flex items-center gap-2 cursor-pointer text-slate-900 dark:text-white font-bold text-xs select-none">
                                <input
                                  type="checkbox"
                                  checked={subTopicCore}
                                  onChange={e => {
                                    setSubTopicCore(e.target.checked);
                                    setFormData({ ...formData, is_core: e.target.checked });
                                  }}
                                  className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                />
                                Core Sub-Topic
                              </label>
                            </div>
                          </div>

                          {/* Row 4: Title, Statement, Add Button */}
                          <div className="grid grid-cols-12 gap-2.5 items-end">
                            <div className="col-span-4">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Sub-Topic Title / Name (Optional)
                              </label>
                              <input
                                type="text"
                                value={subTopicName || formData.name || ''}
                                onChange={e => {
                                  setSubTopicName(e.target.value);
                                  setFormData({ ...formData, name: e.target.value });
                                }}
                                placeholder="e.g. Anatomical Planes Overview"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div className="col-span-6">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Competency Statement / Objective *
                              </label>
                              <input
                                type="text"
                                value={subTopicDesc || formData.description || ''}
                                onChange={e => {
                                  setSubTopicDesc(e.target.value);
                                  setFormData({ ...formData, description: e.target.value });
                                }}
                                placeholder="Describe anatomical position, planes, and clinical importance..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div className="col-span-2">
                              <button
                                type="button"
                                onClick={handleAddSubTopicToQueue}
                                className="w-full py-1.5 px-3 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                              >
                                <span>➕</span> Add
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Temporary Sub-Topics Queue List Table (When multiple added) */}
                        {tempCompetencies.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                              <span className="flex items-center gap-1.5">
                                <span>📋</span> Queued Sub-Topics for Topic ({tempCompetencies.length} items ready to save)
                              </span>
                              <button
                                type="button"
                                onClick={() => setTempCompetencies([])}
                                className="text-[11px] text-rose-500 hover:underline font-bold"
                              >
                                Clear All
                              </button>
                            </div>

                            <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                              {tempCompetencies.map((item, idx) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-mono font-extrabold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
                                      {item.code}
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {item.name ? `${item.name} — ` : ''}{item.description}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ({item.domain} • {item.level})
                                    </span>
                                    {item.is_core && (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                                        ⭐ Core
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setTempCompetencies(tempCompetencies.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-xl shadow-md transition-all active:scale-95">
                      {activeTab === 'competencies' && tempCompetencies.length > 0
                        ? `Save (${tempCompetencies.length}) Sub-Topics to PostgreSQL`
                        : 'Save Record to PostgreSQL'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
