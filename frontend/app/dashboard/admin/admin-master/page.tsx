'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onEdit}
      className="p-1.5 text-[#5B4BFF] hover:text-white bg-indigo-50 hover:bg-[#5B4BFF] dark:bg-indigo-950/40 dark:hover:bg-indigo-600 rounded-lg transition-all"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 rounded-lg transition-all"
      title="Delete"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
);

const TableSkeleton = ({ colCount = 6 }: { colCount?: number }) => (
  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
    {[...Array(5)].map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse bg-white dark:bg-slate-900">
        <td className="pl-5 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-6"></div></td>
        {[...Array(colCount - 2)].map((_, cIdx) => (
          <td key={cIdx} className="py-4 px-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
              {cIdx === 0 && <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2"></div>}
            </div>
          </td>
        ))}
        <td className="pr-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

type SubCategory = 'professional-linkers' | 'departments' | 'subjects' | 'subject-offerings' | 'delivery-types' | 'topics' | 'competencies';

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
  batch_id?: string;
  batch_code?: string;
  credits: number;
  type: string;
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
  topic_id?: string;
  topic_name?: string;
  domain: string;
  level: string;
  is_core: boolean;
  is_active: boolean;
}

interface DeliveryType {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface SubjectOffering {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  prof_id: string;
  prof_name?: string;
  dtype_id: string;
  dtype_code?: string;
  dtype_name?: string;
  batch_year: number;
  hours_allotted: number;
  is_active: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1/admin-master';
const ITEMS_PER_PAGE = 8;

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('professional-linkers');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Data Store Lists
  const [linkers, setLinkers] = useState<ProfessionalLinker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [profPhases, setProfPhases] = useState<any[]>([]);

  // Modal / Form Management
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Resolve tenant slug
  const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tenantSlug') || 'srms-ims';
    }
    return 'srms-ims';
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const slug = getTenantSlug();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': slug,
    };
  };

  // Fetch Category Data with Database Fallback
  const fetchCategoryData = async (cat: SubCategory) => {
    const slug = getTenantSlug();
    try {
      const res = await fetch(`${API_BASE}/${cat}?tenant=${slug}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const dataList = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
        if (cat === 'professional-linkers') {
          setLinkers(dataList);
        } else if (cat === 'departments') {
          setDepartments(dataList);
        } else if (cat === 'subjects') {
          setSubjects(dataList);
        } else if (cat === 'topics') {
          setTopics(dataList);
        } else if (cat === 'competencies') {
          setCompetencies(dataList);
        } else if (cat === 'delivery-types') {
          setDeliveryTypes(dataList);
        } else if (cat === 'subject-offerings') {
          setOfferings(dataList);
        }
      }
    } catch (e) {
      console.warn(`[AdminMaster] Failed to load ${cat} from API:`, e);
    }
  };

  // Fetch Phases for dropdowns
  const fetchPhases = async () => {
    const slug = getTenantSlug();
    try {
      const res = await fetch(`${API_BASE}/professional-linkers?tenant=${slug}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const dataList = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
        setProfPhases(dataList);
      }
    } catch (e) {
      console.warn('[AdminMaster] Failed to load professional phases:', e);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategoryData('professional-linkers'),
        fetchCategoryData('departments'),
        fetchCategoryData('subjects'),
        fetchCategoryData('topics'),
        fetchCategoryData('competencies'),
        fetchCategoryData('delivery-types'),
        fetchCategoryData('subject-offerings'),
        fetchPhases(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Open Modal for Create
  const handleAddNew = () => {
    setEditingItem(null);
    if (activeTab === 'professional-linkers') {
      setFormData({
        code: `CBME-${new Date().getFullYear()}-01`,
        name: '1st Professional Phase I Linker',
        course_cd: 'MBBS',
        professional_phase: '1st Professional (Phase I)',
        academic_session: '2024-2025',
        description: '',
        is_active: true,
      });
    } else if (activeTab === 'departments') {
      setFormData({
        code: 'ANAT',
        name: 'Department of Anatomy',
        type: 'Pre-Clinical',
        is_active: true,
      });
    } else if (activeTab === 'subjects') {
      setFormData({
        code: 'ANAT-101',
        name: 'Human Anatomy & Embryology',
        department_id: departments[0]?.id || '',
        credits: 4,
        type: 'Theory & Practical',
        is_longitudinal: false,
        is_active: true,
      });
    } else if (activeTab === 'subject-offerings') {
      setFormData({
        subject_id: subjects[0]?.id || '',
        prof_id: profPhases[0]?.id || '',
        dtype_id: deliveryTypes[0]?.id || '',
        batch_year: new Date().getFullYear(),
        hours_allotted: 60,
        is_active: true,
      });
    } else if (activeTab === 'delivery-types') {
      setFormData({
        code: 'TH',
        name: 'Theory Lecture',
        is_active: true,
      });
    } else if (activeTab === 'topics') {
      setFormData({
        code: 'TOPIC-01',
        name: 'Gross Anatomy of Upper Limb',
        subject_id: subjects[0]?.id || '',
        linker_id: linkers[0]?.id || '',
        description: 'Shoulder joint, axilla, brachial plexus and arm anatomy',
        hours: 2,
        is_active: true,
      });
    } else if (activeTab === 'competencies') {
      setFormData({
        code: 'AN1.1',
        description: 'Demonstrate normal anatomical position and planes of the human body',
        subject_id: subjects[0]?.id || '',
        topic_id: topics[0]?.id || '',
        linker_id: linkers[0]?.id || '',
        domain: 'Knowledge',
        level: 'Knows How',
        is_core: true,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const slug = getTenantSlug();
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchCategoryData(activeTab);
      } else {
        alert('Failed to delete record.');
      }
    } catch (e) {
      console.error('[AdminMaster] Delete error:', e);
      alert('Network error while deleting record.');
    }
  };

  // Save Record (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = getTenantSlug();
    const isEdit = Boolean(editingItem);
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit
      ? `${API_BASE}/${activeTab}/${editingItem.id}?tenant=${slug}`
      : `${API_BASE}/${activeTab}?tenant=${slug}`;

    let payload: any = { ...formData };

    if (activeTab === 'professional-linkers') {
      payload = {
        code: formData.code,
        name: formData.name,
        course_cd: formData.course_cd || 'MBBS',
        professional_phase: formData.professional_phase || null,
        academic_session: formData.academic_session || null,
        description: formData.description || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'departments') {
      payload = {
        code: formData.code,
        name: formData.name,
        type: formData.type || 'Clinical',
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subjects') {
      payload = {
        code: formData.code,
        name: formData.name,
        department_id: formData.department_id || null,
        credits: Number(formData.credits) || 4,
        is_longitudinal: Boolean(formData.is_longitudinal),
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subject-offerings') {
      payload = {
        subject_id: formData.subject_id,
        prof_id: formData.prof_id,
        dtype_id: formData.dtype_id,
        batch_year: Number(formData.batch_year),
        hours_allotted: formData.hours_allotted !== undefined ? Number(formData.hours_allotted) : 0,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'delivery-types') {
      payload = {
        code: formData.code,
        name: formData.name,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'topics') {
      payload = {
        code: formData.code,
        name: formData.name,
        subject_id: formData.subject_id || null,
        linker_id: formData.linker_id || null,
        description: formData.description || null,
        hours: formData.hours !== undefined ? Number(formData.hours) : 1,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'competencies') {
      payload = {
        code: formData.code,
        description: formData.description,
        subject_id: formData.subject_id || null,
        topic_id: formData.topic_id || null,
        linker_id: formData.linker_id || null,
        domain: formData.domain || 'Knowledge',
        level: formData.level || 'Knows How',
        is_core: formData.is_core !== false,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        await Promise.all([
          fetchCategoryData('professional-linkers'),
          fetchCategoryData('departments'),
          fetchCategoryData('subjects'),
          fetchCategoryData('topics'),
          fetchCategoryData('competencies'),
          fetchCategoryData('delivery-types'),
          fetchCategoryData('subject-offerings'),
        ]);
      } else {
        const errText = await res.text();
        let errMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.message || errText;
          if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
        } catch (_) {}
        alert(`Save failed: ${errMsg}`);
      }
    } catch (err) {
      console.error('[AdminMaster] Save error:', err);
      alert('Network error occurred while saving.');
    }
  };

  // Sub-Category Navigation Tabs
  const categories = [
    { key: 'professional-linkers', label: 'CBME Master', icon: '🔗', count: linkers.length },
    { key: 'departments', label: 'Department Master', icon: '🏥', count: departments.length },
    { key: 'subjects', label: 'Subject Master', icon: '📚', count: subjects.length },
    { key: 'subject-offerings', label: 'Subject Offerings', icon: '🎓', count: offerings.length },
    { key: 'delivery-types', label: 'Delivery Types', icon: '📖', count: deliveryTypes.length },
    { key: 'topics', label: 'Topic Master', icon: '📝', count: topics.length },
    { key: 'competencies', label: 'Competency Master', icon: '🎯', count: competencies.length },
  ];

  // Filtering records by search term
  const filterBySearch = (item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.subject_name && item.subject_name.toLowerCase().includes(term))
    );
  };

  const getFilteredItemsList = () => {
    switch (activeTab) {
      case 'professional-linkers':
        return linkers;
      case 'departments':
        return departments;
      case 'subjects':
        return subjects;
      case 'subject-offerings':
        return offerings;
      case 'delivery-types':
        return deliveryTypes;
      case 'topics':
        return topics;
      case 'competencies':
        return competencies;
      default:
        return [];
    }
  };

  const filteredList = getFilteredItemsList().filter(filterBySearch);
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Admin Master — Medical Curriculum & Academic Structure Setup" />

        <main className="p-6 space-y-6 flex-1">
          {/* Category Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveTab(cat.key as SubCategory); setSearchTerm(''); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 text-left border ${
                  activeTab === cat.key
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 border-[#5B4BFF]'
                    : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 border-[#E7EAF3] dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate text-[11px] font-bold">{cat.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${
                  activeTab === cat.key
                    ? 'bg-white/20 text-white border-transparent'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 border-indigo-500/20'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Control & Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={`Search ${categories.find(c => c.key === activeTab)?.label} by code, name or details...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-[#1B1E28] dark:text-white placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
              />
              <span className="absolute left-3.5 top-3 text-[#7B8794] text-xs">🔍</span>
            </div>

            <button
              onClick={handleAddNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4837E8] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New {categories.find((c) => c.key === activeTab)?.label}</span>
            </button>
          </div>

          {/* Table Container Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Loading</th>
                      <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Details</th>
                      <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <TableSkeleton colCount={6} />
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'professional-linkers' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">SNo</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">CBME Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Name</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">CBME Year</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Status</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[#7B8794] font-semibold">No CBME Masters defined in tenant schema. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((l: any, idx: number) => (
                          <tr key={l.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-bold text-[#1B1E28] dark:text-white">{startIndex + idx + 1}</td>
                            <td className="py-3.5 px-4 font-extrabold text-[#5B4BFF] font-mono">{l.code}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1B1E28] dark:text-white">{l.name}</div>
                              <div className="text-[11px] text-[#7B8794] line-clamp-1">{l.description || 'No additional details provided'}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#4E5969] dark:text-slate-400">{l.academic_session || 'N/A'}</td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                ACTIVE
                              </span>
                            </td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(l)} onDelete={() => handleDelete(l.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'departments' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Department Name</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Classification Type</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">HOD Assigned</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Status</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[#7B8794] font-semibold">No departments found in PostgreSQL schema. Click &apos;Add New&apos; to populate.</td></tr>
                      ) : (
                        paginatedList.map((d: any) => (
                          <tr key={d.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{d.code}</td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{d.name}</td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">{d.type}</td>
                            <td className="py-3.5 px-4">{d.hod_email ? <code className="text-[#5B4BFF] font-mono text-[11px]">{d.hod_email}</code> : <span className="text-slate-400 font-medium">Unassigned</span>}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${d.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                                {d.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(d)} onDelete={() => handleDelete(d.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subjects' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">Subject Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Subject Name</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Department</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Longitudinal?</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Credits / Units</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[#7B8794] font-semibold">No academic subjects found in database. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((s: any) => (
                          <tr key={s.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{s.code}</td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{s.name}</td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300 font-semibold">{s.department_name || 'General Medical'}</td>
                            <td className="py-3.5 px-4">
                              {s.is_longitudinal || s.code === 'CM' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">YES</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">NO</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#5B4BFF] font-bold">{s.credits} Credits</td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(s)} onDelete={() => handleDelete(s.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subject-offerings' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">Subject</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Prof Year / Phase</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Delivery Type</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Batch Year</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Hours Allotted</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[#7B8794] font-semibold">No subject offerings configured. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((o: any) => (
                          <tr key={o.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-bold text-[#1B1E28] dark:text-white">
                              {o.subject_name} <span className="text-[#5B4BFF] font-mono text-[11px]">({o.subject_code})</span>
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300 font-semibold">{o.prof_name}</td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                                {o.dtype_code} ({o.dtype_name})
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400 font-mono text-[11px]">{o.batch_year} Admission</td>
                            <td className="py-3.5 px-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">{o.hours_allotted} hrs</td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(o)} onDelete={() => handleDelete(o.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'delivery-types' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Delivery Type Name</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Status</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-[#7B8794] font-semibold">No delivery types registered. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((dt: any) => (
                          <tr key={dt.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{dt.code}</td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{dt.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${dt.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                                {dt.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(dt)} onDelete={() => handleDelete(dt.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'topics' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">Topic Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Topic Name</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Linked Subject</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Linked CBME</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Allocated Hours</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[#7B8794] font-semibold">No curriculum topics registered in tenant schema. Click &apos;Add New&apos; to start.</td></tr>
                      ) : (
                        paginatedList.map((t: any) => (
                          <tr key={t.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{t.code}</td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{t.name}</td>
                            <td className="py-3.5 px-4">
                              {t.subject_name ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                  {t.subject_name} ({t.subject_code})
                                </span>
                              ) : <span className="text-slate-400">Unassigned</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              {t.cbme_code ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                  {t.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">{t.hours} hrs</td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(t)} onDelete={() => handleDelete(t.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'competencies' && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/60 border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pl-5">NMC Code</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Competency Statement</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Linked CBME</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Subject & Topic</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Blooms Domain</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Level / Type</th>
                        <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-[#7B8794] font-semibold">No medical competencies configured in database. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((c: any) => (
                          <tr key={c.id} className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-extrabold text-[#5B4BFF] font-mono text-sm">{c.code}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#1B1E28] dark:text-white max-w-md">{c.description}</td>
                            <td className="py-3.5 px-4">
                              {c.cbme_code ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                  {c.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="py-3.5 px-4 text-[11px]">
                              <div className="font-bold text-[#1B1E28] dark:text-white">{c.subject_name || 'General'}</div>
                              <div className="text-[#5B4BFF] font-mono">{c.topic_name || 'All Topics'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {c.domain || 'Knowledge'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#1B1E28] dark:text-white font-extrabold text-xs">{c.level || 'KH'}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  c.is_core ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {c.is_core ? 'CORE' : 'NON-CORE'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(c)} onDelete={() => handleDelete(c.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* Pagination Controls Footer */}
                {totalItems > 0 && (
                  <div className="p-4 border-t border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#4E5969] dark:text-slate-400">
                    <div>
                      Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1B1E28] dark:text-white border border-[#E7EAF3] dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-xs"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all ${
                              currentPage === pg
                                ? 'bg-[#5B4BFF] text-white font-bold shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[#4E5969] dark:text-slate-300'
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
                        className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1B1E28] dark:text-white border border-[#E7EAF3] dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-xs"
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
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] via-[#352B88] to-[#2D2575] text-white">
                  <h3 className="font-extrabold text-white text-base">
                    {editingItem ? `Edit ${categories.find(c => c.key === activeTab)?.label}` : `Create New ${categories.find(c => c.key === activeTab)?.label}`}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white text-lg font-bold px-2 py-0.5 rounded hover:bg-white/10 transition-colors">✕</button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-medium">
                  {/* Form fields for ProfessionalLinker */}
                  {activeTab === 'professional-linkers' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">CBME Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. LINK-MBBS-P1" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Course Code</label>
                          <input type="text" value={formData.course_cd || ''} onChange={e => setFormData({ ...formData, course_cd: e.target.value })} placeholder="e.g. MBBS" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">CBME Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="1st Professional Phase I Linker" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Professional Phase</label>
                          <input type="text" value={formData.professional_phase || ''} onChange={e => setFormData({ ...formData, professional_phase: e.target.value })} placeholder="1st Professional (Phase I)" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">CBME Year (Academic Session)</label>
                          <input type="text" value={formData.academic_session || ''} onChange={e => setFormData({ ...formData, academic_session: e.target.value })} placeholder="2024-2025" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Description</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Linking subjects and modules for this academic phase..." className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all h-auto min-h-[80px] resize-none"></textarea>
                      </div>
                    </>
                  )}

                  {/* Form fields for Departments */}
                  {activeTab === 'departments' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Department Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT, MED, SURG" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Classification Type *</label>
                          <select required value={formData.type || 'Pre-Clinical'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="Pre-Clinical">Pre-Clinical (Phase I)</option>
                            <option value="Para-Clinical">Para-Clinical (Phase II)</option>
                            <option value="Clinical">Clinical (Phase III & IV)</option>
                            <option value="Super-Specialty">Super-Specialty / Higher Specialties</option>
                            <option value="Diagnostic">Diagnostic & Laboratory</option>
                            <option value="Administrative">Administrative / Support</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Department Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Department of Human Anatomy" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      </div>
                    </>
                  )}

                  {/* Form fields for Subjects */}
                  {activeTab === 'subjects' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Subject Code *</label>
                        <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT-101" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Subject Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Human Anatomy & Embryology" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Department</label>
                          <select value={formData.department_id || ''} onChange={e => setFormData({ ...formData, department_id: e.target.value || null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Department --</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Course Credits / Units</label>
                          <input type="number" min="1" max="50" value={formData.credits || 4} onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Is Longitudinal Subject? *</label>
                        <select
                          required
                          value={formData.is_longitudinal ? 'true' : 'false'}
                          onChange={e => setFormData({ ...formData, is_longitudinal: e.target.value === 'true' })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                          <option value="false">No (Standard Phase-Bound Subject)</option>
                          <option value="true">Yes (Longitudinal Subject runs across multiple phases)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Form fields for Subject Offerings */}
                  {activeTab === 'subject-offerings' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Select Subject *</label>
                        <select required value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                          <option value="">-- Select Subject --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Professional Year / Phase *</label>
                          <select required value={formData.prof_id || ''} onChange={e => setFormData({ ...formData, prof_id: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Phase --</option>
                            {profPhases.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Delivery Type *</label>
                          <select required value={formData.dtype_id || ''} onChange={e => setFormData({ ...formData, dtype_id: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Delivery Type --</option>
                            {deliveryTypes.map(dt => (
                              <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Batch Admission Year *</label>
                          <input type="number" required min="2000" max="2100" value={formData.batch_year || 2024} onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Hours Allotted</label>
                          <input type="number" min="0" max="1000" value={formData.hours_allotted || 0} onChange={e => setFormData({ ...formData, hours_allotted: Number(e.target.value) })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Delivery Types */}
                  {activeTab === 'delivery-types' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. TH, PR" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Name *</label>
                          <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Theory, Practical" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Topics */}
                  {activeTab === 'topics' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Topic Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT-TOPIC-1" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Linked Subject</label>
                          <select value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value || null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Linked CBME Master</label>
                        <select value={formData.linker_id || ''} onChange={e => setFormData({ ...formData, linker_id: e.target.value || null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                          <option value="">-- Select CBME Master --</option>
                          {linkers.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Topic Title / Module Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Upper & Lower Limb Gross Anatomy" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Description / Syllabus Scope</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Key structures, neurovascular bundles, musculotendinous anatomy..." className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all h-auto min-h-[80px] resize-none"></textarea>
                      </div>
                      <div className="w-1/2 pr-1">
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Allocated Teaching Hours</label>
                        <input type="number" min="1" max="200" value={formData.hours || 2} onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                      </div>
                    </>
                  )}

                  {/* Form fields for Competency Master */}
                  {activeTab === 'competencies' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">NMC Competency Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. AN1.1, PY2.4" className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Blooms Learning Domain</label>
                          <select value={formData.domain || 'Knowledge'} onChange={e => setFormData({ ...formData, domain: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="Knowledge">Knowledge (Cognitive)</option>
                            <option value="Skill">Skill (Psychomotor)</option>
                            <option value="Attitude">Attitude (Affective)</option>
                            <option value="Communication">Communication</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Competency Statement *</label>
                        <textarea rows={2} required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe normal anatomical positions, planes and standard terminology..." className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all h-auto min-h-[60px] resize-none"></textarea>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Linked CBME Master</label>
                        <select value={formData.linker_id || ''} onChange={e => setFormData({ ...formData, linker_id: e.target.value || null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                          <option value="">-- Select CBME Master --</option>
                          {linkers.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Subject</label>
                          <select value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value || null, topic_id: null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Topic</label>
                          <select value={formData.topic_id || ''} onChange={e => setFormData({ ...formData, topic_id: e.target.value || null })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option value="">-- Select Topic --</option>
                            {topics.filter(t => !formData.subject_id || t.subject_id === formData.subject_id).map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Mastery Level</label>
                          <select value={formData.level || 'Knows How'} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold">
                            <option value="Knows">Knows (K)</option>
                            <option value="Knows How">Knows How (KH)</option>
                            <option value="Shows How">Shows How (SH)</option>
                            <option value="Performs">Performs (P)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-[#1B1E28] dark:text-white font-bold text-xs select-none">
                            <input type="checkbox" checked={formData.is_core !== false} onChange={e => setFormData({ ...formData, is_core: e.target.checked })} className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-white border-[#E7EAF3]" />
                            Core Competency (NMC Mandatory)
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-[#4837E8] text-white shadow-md shadow-indigo-500/25 transition-all">
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
