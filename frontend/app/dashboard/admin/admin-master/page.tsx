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

type SubCategory = 'departments' | 'subjects' | 'professional-linkers' | 'subject-offerings' | 'delivery-types' | 'topics' | 'competencies';

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
  batch_id?: string;
  batch_code?: string;
  college_id?: string;
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
  description?: string;
  hours: number;
  is_active: boolean;
}

interface Competency {
  id: string;
  code: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  topic_id?: string;
  topic_name?: string;
  topic_code?: string;
  domain: string;
  level: string;
  is_core: boolean;
  is_active: boolean;
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

  const [colleges, setColleges] = useState<College[]>([]);
  const [linkers, setLinkers] = useState<ProfessionalLinker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [profPhases, setProfPhases] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

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
      }
    } catch (err) {
      console.error(`[AdminMaster] Error loading ${targetCat}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async (collegeFilter?: string) => {
    try {
      const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
      const targetSlug = filter !== 'all' ? (colleges.find(c => c.id === filter || c.slug === filter)?.slug || 'srms-ims') : 'srms-ims';
      const res = await fetch(`${COLLEGE_API_BASE}/professionals?tenant=${targetSlug}`);
      if (res.ok) {
        const json = await res.json();
        setProfPhases(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading professionals:', err);
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
        fetchCategoryData('departments', 'all'),
        fetchCategoryData('subjects', 'all'),
        fetchCategoryData('professional-linkers', 'all'),
        fetchCategoryData('topics', 'all'),
        fetchCategoryData('competencies', 'all'),
        fetchCategoryData('delivery-types', 'all'),
        fetchCategoryData('subject-offerings', 'all'),
        fetchProfessionals('all'),
      ]);
    };
    loadAll();
  }, []);

  const handleCollegeFilterChange = async (newColgFilter: string) => {
    setSelectedCollegeFilter(newColgFilter);
    setCurrentPage(1);
    await Promise.all([
      fetchCategoryData(activeTab, newColgFilter),
      fetchCategoryData('departments', newColgFilter),
      fetchCategoryData('subjects', newColgFilter),
      fetchProfessionals(newColgFilter),
    ]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const isMatchCollege = (item: any) => {
    if (selectedCollegeFilter === 'all') return true;
    const targetSlug = colleges.find(c => c.id === selectedCollegeFilter)?.slug || selectedCollegeFilter;
    return (
      item.college_id === selectedCollegeFilter ||
      item.college_slug === targetSlug ||
      item.college_slug === selectedCollegeFilter
    );
  };

  const handleAddNew = () => {
    setEditingItem(null);
    const defaultCol = selectedCollegeFilter !== 'all' 
      ? colleges.find(c => c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0] 
      : colleges[0];
    
    const defaultCollegeId = defaultCol?.id || '';
    const defaultCollegeSlug = defaultCol?.slug || 'srms-ims';

    if (activeTab === 'departments') {
      const isIms = defaultCollegeSlug === 'srms-ims';
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        code: '',
        name: '',
        type: isIms ? 'Pre-Clinical' : 'Engineering',
      });
    } else if (activeTab === 'subjects') {
      const availableDepts = departments.filter(d => 
        !defaultCollegeId || d.college_id === defaultCollegeId || d.college_slug === defaultCollegeSlug
      );
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        department_id: availableDepts[0]?.id || '',
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
      const availableSubjects = subjects.filter(s => 
        !defaultCollegeId || s.college_id === defaultCollegeId || s.college_slug === defaultCollegeSlug
      );
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        subject_id: availableSubjects[0]?.id || subjects[0]?.id || '',
        prof_id: profPhases[0]?.id || '',
        dtype_id: deliveryTypes[0]?.id || '',
        batch_year: 2024,
        hours_allotted: 100,
      });
    } else if (activeTab === 'delivery-types') {
      setFormData({ code: '', name: '' });
    } else if (activeTab === 'topics') {
      const availableSubjects = subjects.filter(s => 
        !defaultCollegeId || s.college_id === defaultCollegeId || s.college_slug === defaultCollegeSlug
      );
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        code: '',
        name: '',
        subject_id: availableSubjects[0]?.id || subjects[0]?.id || '',
        description: '',
        hours: 2,
      });
    } else if (activeTab === 'competencies') {
      const availableSubjects = subjects.filter(s => 
        !defaultCollegeId || s.college_id === defaultCollegeId || s.college_slug === defaultCollegeSlug
      );
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        code: '',
        description: '',
        subject_id: availableSubjects[0]?.id || subjects[0]?.id || '',
        topic_id: topics[0]?.id || '',
        domain: 'Knowledge',
        level: 'Knows How',
        is_core: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const matchedCol = colleges.find(c => c.id === item.college_id || c.slug === item.college_slug) || colleges[0];
    setFormData({
      ...item,
      college_id: item.college_id || matchedCol?.id || '',
      college_slug: item.college_slug || matchedCol?.slug || 'srms-ims',
      department_id: item.department_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const targetSlug = itemCollegeSlug || getActiveTenantSlug();
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?tenant=${targetSlug === 'all' ? 'srms-ims' : targetSlug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCategoryData(activeTab);
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
      payload = { code: formData.code, name: formData.name, type: formData.type || 'Pre-Clinical', hod_user_id: formData.hod_user_id || null };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subjects') {
      payload = { code: formData.code, name: formData.name, department_id: formData.department_id || null, batch_id: formData.batch_id || null, credits: formData.credits !== undefined ? Number(formData.credits) : 4, type: formData.type || 'Combined', is_longitudinal: Boolean(formData.is_longitudinal) };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'professional-linkers') {
      payload = { code: formData.code, name: formData.name, course_cd: formData.course_cd || null, professional_phase: formData.professional_phase || null, academic_session: formData.academic_session || null, description: formData.description || null };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subject-offerings') {
      payload = { subject_id: formData.subject_id, prof_id: formData.prof_id, dtype_id: formData.dtype_id, batch_year: Number(formData.batch_year), hours_allotted: formData.hours_allotted !== undefined ? Number(formData.hours_allotted) : 0 };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'delivery-types') {
      payload = { code: formData.code, name: formData.name };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'topics') {
      payload = { code: formData.code, name: formData.name, subject_id: formData.subject_id || null, linker_id: formData.linker_id || null, description: formData.description || null, hours: formData.hours !== undefined ? Number(formData.hours) : 1 };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'competencies') {
      payload = { code: formData.code, description: formData.description, subject_id: formData.subject_id || null, topic_id: formData.topic_id || null, linker_id: formData.linker_id || null, domain: formData.domain || 'Knowledge', level: formData.level || 'Knows How', is_core: formData.is_core !== false };
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
        await Promise.all([fetchCategoryData('departments'), fetchCategoryData('subjects'), fetchCategoryData(activeTab)]);
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
    { key: 'professional-linkers', label: '3. CBME Master', icon: '🔗', count: linkers.length },
    { key: 'subject-offerings', label: '4. Subject Offerings', icon: '🎓', count: offerings.length },
    { key: 'delivery-types', label: '5. Delivery Types', icon: '📖', count: deliveryTypes.length },
    { key: 'topics', label: '6. Topic Master', icon: '📝', count: topics.length },
    { key: 'competencies', label: '7. Competency Master', icon: '🎯', count: competencies.length },
  ];

  const getFilteredItemsList = () => {
    switch (activeTab) {
      case 'departments': return departments;
      case 'subjects': return subjects;
      case 'professional-linkers': return linkers;
      case 'subject-offerings': return offerings;
      case 'delivery-types': return deliveryTypes;
      case 'topics': return topics;
      case 'competencies': return competencies;
      default: return [];
    }
  };

  const filteredList = getFilteredItemsList().filter((item) => {
    if (!isMatchCollege(item)) return false;
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

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="flex items-center gap-2 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shrink-0 shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🏛️</span> College:</span>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => handleCollegeFilterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Registered Colleges ({colleges.length})</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>{col.code ? `[#${col.code}] ` : ''}{col.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder={`Search...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#5B4BFF] transition-all"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'departments' && (
                <button onClick={syncDepartmentsFromPortal} disabled={syncing} className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95">
                  <span className={syncing ? 'animate-spin' : ''}>🌐</span>
                  <span>{syncing ? 'Syncing...' : 'Sync SRMS Departments'}</span>
                </button>
              )}
              <button onClick={handleAddNew} className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                <span>Add New</span>
              </button>
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
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold font-mono text-[#5B4BFF] dark:text-indigo-400">
                                    {d.code}
                                  </span>
                                  {d.branch_cd && (
                                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[#F36C21] font-bold text-[9px] border border-orange-500/20">
                                      #{d.branch_cd}
                                    </span>
                                  )}
                                </div>
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
                                    🩺 {s.department_name} {s.department_code ? `(${s.department_code})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">General Medical</span>
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
                        <th className="p-4">CBME Code</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Academic Session</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No CBME Masters defined in tenant schema. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((l: any, idx: number) => (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold">{startIndex + idx + 1}</td>
                            <td className="p-4 font-extrabold text-[#5B4BFF] font-mono">{l.code}</td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white">{l.name}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{l.description || 'No additional details'}</div>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">{l.academic_session || 'N/A'}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                ACTIVE
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(l)} onDelete={() => handleDelete(l.id, l.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subject-offerings' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Subject</th>
                        <th className="p-4">Prof Year / Phase</th>
                        <th className="p-4">Delivery Type</th>
                        <th className="p-4">Batch Year</th>
                        <th className="p-4">Hours Allotted</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No subject offerings configured. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((o: any) => (
                          <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                              {o.subject_name} <span className="text-[#5B4BFF] font-mono text-[11px]">({o.subject_code})</span>
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{o.prof_name}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono text-[11px] font-bold">
                                {o.dtype_code} ({o.dtype_name})
                              </span>
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">{o.batch_year} Admission</td>
                            <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">{o.hours_allotted} hrs</td>
                            <td className="p-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(o)} onDelete={() => handleDelete(o.id, o.college_slug)} />
                            </td>
                          </tr>
                        ))
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

                {activeTab === 'topics' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Topic Code</th>
                        <th className="p-4">Topic Name</th>
                        <th className="p-4">Linked Subject</th>
                        <th className="p-4">Linked CBME</th>
                        <th className="p-4">Allocated Hours</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No curriculum topics registered in tenant schema. Click &apos;Add New&apos; to start.</td></tr>
                      ) : (
                        paginatedList.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{t.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{t.name}</td>
                            <td className="p-4">
                              {t.subject_name ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-bold">
                                  {t.subject_name} ({t.subject_code})
                                </span>
                              ) : <span className="text-slate-400">Unassigned</span>}
                            </td>
                            <td className="p-4">
                              {t.cbme_code ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold font-mono">
                                  {t.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">{t.hours} hrs</td>
                            <td className="p-4 pr-5 text-right">
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
                        <th className="p-4 pl-5">NMC Code</th>
                        <th className="p-4">Competency Statement</th>
                        <th className="p-4">Linked CBME</th>
                        <th className="p-4">Subject & Topic</th>
                        <th className="p-4">Blooms Domain</th>
                        <th className="p-4">Level / Type</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No medical competencies configured. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] font-mono text-sm">{c.code}</td>
                            <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-md">{c.description}</td>
                            <td className="p-4">
                              {c.cbme_code ? (
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold font-mono">
                                  {c.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="p-4 text-[11px]">
                              <div className="font-bold text-slate-700 dark:text-slate-300">{c.subject_name || 'General'}</div>
                              <div className="text-[#5B4BFF] font-mono">{c.topic_name || 'All Topics'}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                {c.domain || 'Knowledge'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-900 dark:text-white font-extrabold text-xs">{c.level || 'KH'}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  c.is_core ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {c.is_core ? 'CORE' : 'NON-CORE'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 pr-5 text-right">
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
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#F6F8FC] dark:bg-slate-800/60">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {editingItem ? `Edit ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}` : `Create New ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}`}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 text-lg font-bold px-2 py-0.5 rounded transition-colors">✕</button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-medium">
                  {/* Form fields for Departments */}
                  {activeTab === 'departments' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select College *</label>
                        <select
                          required
                          value={formData.college_id || ''}
                          onChange={(e) => {
                            const newColId = e.target.value;
                            const newCol = colleges.find(c => c.id === newColId);
                            setFormData({
                              ...formData,
                              college_id: newColId,
                              college_slug: newCol?.slug || '',
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        >
                          {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.code ? `[#${c.code}] ` : ''}{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department Code *</label>
                          <input
                            type="text"
                            required
                            value={formData.code || ''}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. ANAT, CSE, PHARM"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classification Type *</label>
                          <select
                            required
                            value={formData.type || 'Pre-Clinical'}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="Pre-Clinical">Pre-Clinical (Phase I)</option>
                            <option value="Para-Clinical">Para-Clinical (Phase II)</option>
                            <option value="Clinical">Clinical (Phase III & IV)</option>
                            <option value="Engineering">Engineering & Technology</option>
                            <option value="Pharmacy">Pharmacy & Pharmacology</option>
                            <option value="Management">Management & Commerce</option>
                            <option value="Super-Specialty">Super-Specialty / Higher Specialties</option>
                            <option value="Diagnostic">Diagnostic & Laboratory</option>
                            <option value="Administrative">Administrative / Support</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Department of Human Anatomy"
                          className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        />
                      </div>
                    </>
                  )}

                  {/* Form fields for Subjects (With College & Cascading Department Selection) */}
                  {activeTab === 'subjects' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select College *</label>
                        <select
                          required
                          value={formData.college_id || ''}
                          onChange={(e) => {
                            const newColId = e.target.value;
                            const newCol = colleges.find(c => c.id === newColId);
                            const newDepts = departments.filter(d => d.college_id === newColId || d.college_slug === newCol?.slug);
                            setFormData({
                              ...formData,
                              college_id: newColId,
                              college_slug: newCol?.slug || '',
                              department_id: newDepts[0]?.id || '',
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        >
                          {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.code ? `[#${c.code}] ` : ''}{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Department * (College Wise)</label>
                        <select
                          required
                          value={formData.department_id || ''}
                          onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        >
                          <option value="">-- Choose Department for Subject --</option>
                          {modalDepartments.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code}){d.course_name ? ` — ${d.course_name}` : ''}
                            </option>
                          ))}
                        </select>
                        {modalDepartments.length === 0 && (
                          <p className="text-[11px] text-amber-600 mt-1">
                            ⚠️ No departments found for this college. Switch to &apos;Department Master&apos; tab to add or sync departments.
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
                            placeholder="e.g. ANAT-101, CS-301"
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
                          placeholder="e.g. Human Anatomy & Embryology, Data Structures"
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
                  )}

                  {/* Form fields for ProfessionalLinker */}
                  {activeTab === 'professional-linkers' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CBME Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. LINK-MBBS-P1" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                          <input type="text" value={formData.course_cd || ''} onChange={e => setFormData({ ...formData, course_cd: e.target.value })} placeholder="e.g. MBBS" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CBME Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="1st Professional Phase I Linker" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Professional Phase</label>
                          <input type="text" value={formData.professional_phase || ''} onChange={e => setFormData({ ...formData, professional_phase: e.target.value })} placeholder="1st Professional (Phase I)" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CBME Year (Academic Session)</label>
                          <input type="text" value={formData.academic_session || ''} onChange={e => setFormData({ ...formData, academic_session: e.target.value })} placeholder="2024-2025" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Linking subjects and modules for this academic phase..." className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"></textarea>
                      </div>
                    </>
                  )}

                  {/* Form fields for Subject Offerings */}
                  {activeTab === 'subject-offerings' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Subject *</label>
                        <select required value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                          <option value="">-- Select Subject --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Professional Year / Phase *</label>
                          <select required value={formData.prof_id || ''} onChange={e => setFormData({ ...formData, prof_id: e.target.value })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="">-- Select Phase --</option>
                            {profPhases.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery Type *</label>
                          <select required value={formData.dtype_id || ''} onChange={e => setFormData({ ...formData, dtype_id: e.target.value })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="">-- Select Delivery Type --</option>
                            {deliveryTypes.map(dt => (
                              <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch Admission Year *</label>
                          <input type="number" required min="2000" max="2100" value={formData.batch_year || 2024} onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hours Allotted</label>
                          <input type="number" min="0" max="1000" value={formData.hours_allotted || 0} onChange={e => setFormData({ ...formData, hours_allotted: Number(e.target.value) })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                    </>
                  )}

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

                  {/* Form fields for Topics */}
                  {activeTab === 'topics' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topic Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT-TOPIC-1" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Linked Subject</label>
                          <select value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value || null })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topic Title *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Introduction to Upper Limb Anatomy" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Linked CBME Linker</label>
                          <select value={formData.linker_id || ''} onChange={e => setFormData({ ...formData, linker_id: e.target.value || null })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="">-- Select CBME Linker (Optional) --</option>
                            {linkers.map(l => (
                              <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Allocated Hours</label>
                          <input type="number" min="1" max="100" value={formData.hours || 2} onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Competencies */}
                  {activeTab === 'competencies' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NMC Competency Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. AN1.1, PY1.2" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Blooms Domain *</label>
                          <select value={formData.domain || 'Knowledge'} onChange={e => setFormData({ ...formData, domain: e.target.value })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="Knowledge">Knowledge (Cognitive)</option>
                            <option value="Skills">Skills (Psychomotor)</option>
                            <option value="Attitude">Attitude (Affective)</option>
                            <option value="Communication">Communication</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Competency Statement *</label>
                        <textarea rows={3} required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe anatomical structure, embryological origins, clinical importance..." className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"></textarea>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mastery Level</label>
                          <select value={formData.level || 'Knows How'} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]">
                            <option value="Knows">Knows (K)</option>
                            <option value="Knows How">Knows How (KH)</option>
                            <option value="Shows How">Shows How (SH)</option>
                            <option value="Performs">Performs (P)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-slate-900 dark:text-white font-bold text-xs select-none">
                            <input type="checkbox" checked={formData.is_core !== false} onChange={e => setFormData({ ...formData, is_core: e.target.checked })} className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-[#F6F8FC] dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
                            Core Competency (NMC Mandatory)
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-xl shadow-md transition-all active:scale-95">
                      Save Record to PostgreSQL
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
