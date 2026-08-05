'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onEdit}
      className="p-1.5 text-[var(--color-primary-700)] hover:text-white bg-[var(--color-primary-100)] hover:bg-[var(--color-primary-700)] rounded-lg transition-all"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 text-[var(--color-danger)] hover:text-white bg-[var(--color-danger-tint)] hover:bg-[var(--color-danger)] rounded-lg transition-all"
      title="Delete"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
);

const TableSkeleton = ({ colCount = 6 }: { colCount?: number }) => (
  <tbody className="divide-y divide-[var(--color-border)]">
    {[...Array(5)].map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse bg-[var(--color-bg-surface)]">
        <td className="pl-5 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded w-6"></div></td>
        {[...Array(colCount - 2)].map((_, cIdx) => (
          <td key={cIdx} className="py-4 px-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded w-2/3"></div>
              {cIdx === 0 && <div className="h-3 bg-slate-100 dark:bg-slate-900/50 rounded w-1/2"></div>}
            </div>
          </td>
        ))}
        <td className="pr-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
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
const TENANT = 'srms-ims';

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('professional-linkers');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states (stored exclusively in PostgreSQL)
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

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch data for current category
  const fetchCategoryData = async (cat?: SubCategory) => {
    const targetCat = cat || activeTab;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetCat}?tenant=${TENANT}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json || [];
        if (targetCat === 'professional-linkers') setLinkers(data);
        if (targetCat === 'departments') setDepartments(data);
        if (targetCat === 'subjects') setSubjects(data);
        if (targetCat === 'topics') setTopics(data);
        if (targetCat === 'competencies') setCompetencies(data);
        if (targetCat === 'delivery-types') setDeliveryTypes(data);
        if (targetCat === 'subject-offerings') setOfferings(data);
      } else {
        console.error(`[AdminMaster] Failed to fetch ${targetCat}:`, res.statusText);
      }
    } catch (err) {
      console.error(`[AdminMaster] Error loading ${targetCat}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/college-master/professionals?tenant=${TENANT}`);
      if (res.ok) {
        const json = await res.json();
        setProfPhases(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading professionals:', err);
    }
  };

  // On mount: load all categories from PostgreSQL (zero localStorage usage)
  useEffect(() => {
    ['mederp_linkers', 'mederp_admin_depts', 'mederp_subjects', 'mederp_topics', 'mederp_competencies']
      .forEach(k => localStorage.removeItem(k));

    const loadAll = async () => {
      await Promise.all([
        fetchCategoryData('professional-linkers'),
        fetchCategoryData('departments'),
        fetchCategoryData('subjects'),
        fetchCategoryData('topics'),
        fetchCategoryData('competencies'),
        fetchCategoryData('delivery-types'),
        fetchCategoryData('subject-offerings'),
        fetchProfessionals(),
      ]);
    };
    loadAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleAddNew = () => {
    setEditingItem(null);
    if (activeTab === 'professional-linkers') {
      setFormData({ code: 'LINK-MBBS-P1', name: '', course_cd: 'MBBS', professional_phase: '1st Professional (Phase I)', academic_session: '2024-2025', description: '' });
    } else if (activeTab === 'departments') {
      setFormData({ code: '', name: '', type: 'Pre-Clinical' });
    } else if (activeTab === 'subjects') {
      setFormData({ code: '', name: '', department_id: departments[0]?.id || '', credits: 4, is_longitudinal: false });
    } else if (activeTab === 'subject-offerings') {
      setFormData({ subject_id: subjects[0]?.id || '', prof_id: profPhases[0]?.id || '', dtype_id: deliveryTypes[0]?.id || '', batch_year: 2024, hours_allotted: 100 });
    } else if (activeTab === 'delivery-types') {
      setFormData({ code: '', name: '' });
    } else if (activeTab === 'topics') {
      setFormData({ code: '', name: '', subject_id: subjects[0]?.id || '', description: '', hours: 2 });
    } else if (activeTab === 'competencies') {
      setFormData({ code: '', description: '', subject_id: subjects[0]?.id || '', topic_id: topics[0]?.id || '', domain: 'Knowledge', level: 'Knows How', is_core: true });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record from the PostgreSQL tenant schema?')) return;
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?tenant=${TENANT}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        console.log(`[AdminMaster] Deleted record ${id} successfully ✅`);
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
    const url = isEdit
      ? `${API_BASE}/${activeTab}/${editingItem.id}?tenant=${TENANT}`
      : `${API_BASE}/${activeTab}?tenant=${TENANT}`;
    const method = isEdit ? 'PUT' : 'POST';

    // Construct whitelisted payload to prevent 400 Bad Request from NestJS ValidationPipe
    let payload: any = {};
    if (activeTab === 'professional-linkers') {
      payload = {
        code: formData.code,
        name: formData.name,
        course_cd: formData.course_cd || null,
        professional_phase: formData.professional_phase || null,
        academic_session: formData.academic_session || null,
        description: formData.description || null,
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    } else if (activeTab === 'departments') {
      payload = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        hod_user_id: formData.hod_user_id || null,
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    } else if (activeTab === 'subjects') {
      payload = {
        code: formData.code,
        name: formData.name,
        department_id: formData.department_id || null,
        batch_id: formData.batch_id || null,
        credits: formData.credits !== undefined ? Number(formData.credits) : 4,
        type: formData.type || 'Combined',
        is_longitudinal: Boolean(formData.is_longitudinal),
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    } else if (activeTab === 'subject-offerings') {
      payload = {
        subject_id: formData.subject_id,
        prof_id: formData.prof_id,
        dtype_id: formData.dtype_id,
        batch_year: Number(formData.batch_year),
        hours_allotted: formData.hours_allotted !== undefined ? Number(formData.hours_allotted) : 0,
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    } else if (activeTab === 'delivery-types') {
      payload = {
        code: formData.code,
        name: formData.name,
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    } else if (activeTab === 'topics') {
      payload = {
        code: formData.code,
        name: formData.name,
        subject_id: formData.subject_id || null,
        linker_id: formData.linker_id || null,
        description: formData.description || null,
        hours: formData.hours !== undefined ? Number(formData.hours) : 1,
      };
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
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
      if (isEdit) {
        payload.is_active = formData.is_active !== false;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        console.log(`[AdminMaster] Record saved successfully to PostgreSQL ✅`);
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
        const err = await res.text();
        alert(`Save failed: ${err}`);
      }
    } catch (err) {
      console.error('[AdminMaster] Save error:', err);
      alert('Network error occurred while saving.');
    }
  };

  // Sub-Category Navigation Tabs
  const categories = [
    { key: 'professional-linkers', label: '1. CBME Master', icon: '🔗', count: linkers.length },
    { key: 'departments', label: '2. Department Master', icon: '🏥', count: departments.length },
    { key: 'subjects', label: '3. Subject Master', icon: '📚', count: subjects.length },
    { key: 'subject-offerings', label: '4. Subject Offerings', icon: '🎓', count: offerings.length },
    { key: 'delivery-types', label: '5. Delivery Types', icon: '📖', count: deliveryTypes.length },
    { key: 'topics', label: '6. Topic Master', icon: '📝', count: topics.length },
    { key: 'competencies', label: '7. Competency Master', icon: '🎯', count: competencies.length },
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
    <div className="flex min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-ink-900)] font-sans transition-colors">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="AdminMaster — Medical Curriculum & Academic Structure Setup" />

        <main className="p-6 space-y-6 flex-1">
          {/* Category Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 border-b border-[var(--color-border)] pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveTab(cat.key as SubCategory); setSearchTerm(''); }}
                className={`px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left border ${
                  activeTab === cat.key
                    ? 'bg-[var(--color-primary-700)] text-white shadow-sm border-[var(--color-primary-700)] relative after:absolute after:left-3.5 after:bottom-1 after:w-5 after:h-[2px] after:bg-[var(--color-accent-brass)]'
                    : 'bg-[var(--color-bg-surface)] text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-bg-sunken)] border-[var(--color-border)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <span className="truncate text-[11px] font-bold">{cat.label.split('. ')[1]}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${
                  activeTab === cat.key
                    ? 'bg-white/20 text-white border-transparent'
                    : 'bg-[var(--color-bg-sunken)] text-[var(--color-primary-700)] border-[var(--color-border)]'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Control Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'professional-linkers' ? 'CBME Master' : activeTab.replace('-', ' ')} by code, name or details...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="premium-input pl-9"
              />
              <span className="absolute left-3 top-3 text-[var(--color-ink-500)] text-xs">🔍</span>
            </div>

            <button
              onClick={handleAddNew}
              className="premium-btn-primary shadow-sm flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add New {categories.find((c) => c.key === activeTab)?.label.split('. ')[1]}
            </button>
          </div>

          {/* Table Content Section */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="premium-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      {activeTab === 'professional-linkers' && (
                        <>
                          <th className="pl-5">SNo</th>
                          <th>CBME Code</th>
                          <th>Name</th>
                          <th>CBME Year</th>
                          <th>Status</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'departments' && (
                        <>
                          <th className="pl-5">Code</th>
                          <th>Department Name</th>
                          <th>Classification Type</th>
                          <th>HOD Assigned</th>
                          <th>Status</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'subjects' && (
                        <>
                          <th className="pl-5">Subject Code</th>
                          <th>Subject Name</th>
                          <th>Department</th>
                          <th>Longitudinal?</th>
                          <th>Credits / Units</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'subject-offerings' && (
                        <>
                          <th className="pl-5">Subject</th>
                          <th>Prof Year / Phase</th>
                          <th>Delivery Type</th>
                          <th>Batch Year</th>
                          <th>Hours Allotted</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'delivery-types' && (
                        <>
                          <th className="pl-5">Code</th>
                          <th>Delivery Type Name</th>
                          <th>Status</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'topics' && (
                        <>
                          <th className="pl-5">Topic Code</th>
                          <th>Topic Name</th>
                          <th>Linked Subject</th>
                          <th>Linked CBME</th>
                          <th>Allocated Hours</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                      {activeTab === 'competencies' && (
                        <>
                          <th className="pl-5">NMC Code</th>
                          <th>Competency Statement</th>
                          <th>Linked CBME</th>
                          <th>Subject & Topic</th>
                          <th>Blooms Domain</th>
                          <th>Level / Type</th>
                          <th className="pr-5 text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <TableSkeleton colCount={
                    activeTab === 'competencies' ? 7 :
                    activeTab === 'subjects' ? 6 :
                    activeTab === 'topics' ? 6 :
                    activeTab === 'subject-offerings' ? 6 :
                    activeTab === 'professional-linkers' ? 6 :
                    activeTab === 'departments' ? 6 : 4
                  } />
                </table>
              </div>
            ) : (
              <div className="premium-table-wrapper">
                {activeTab === 'professional-linkers' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">SNo</th>
                        <th>CBME Code</th>
                        <th>Name</th>
                        <th>CBME Year</th>
                        <th>Status</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No CBME Masters defined in tenant schema. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((l: any, idx: number) => (
                          <tr key={l.id} className="transition-colors">
                            <td className="pl-5 font-bold">{startIndex + idx + 1}</td>
                            <td className="font-extrabold text-[var(--color-primary-700)] font-mono">{l.code}</td>
                            <td>
                              <div className="font-bold text-[var(--color-ink-900)]">{l.name}</div>
                              <div className="text-[11px] text-[var(--color-ink-500)] line-clamp-1">{l.description || 'No additional details provided'}</div>
                            </td>
                            <td className="font-mono text-[11px] text-[var(--color-ink-700)]">{l.academic_session || 'N/A'}</td>
                            <td>
                              <span className="premium-badge bg-[var(--color-success-tint)] text-[var(--color-success)] border border-[var(--color-success)]/10">
                                ACTIVE
                              </span>
                            </td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(l)} onDelete={() => handleDelete(l.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'departments' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">Code</th>
                        <th>Department Name</th>
                        <th>Classification Type</th>
                        <th>HOD Assigned</th>
                        <th>Status</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No departments found in PostgreSQL schema. Click &apos;Add New&apos; to populate.</td></tr>
                      ) : (
                        paginatedList.map((d: any) => (
                          <tr key={d.id} className="transition-colors">
                            <td className="pl-5 font-extrabold text-[var(--color-primary-700)] font-mono">{d.code}</td>
                            <td className="font-bold text-[var(--color-ink-900)]">{d.name}</td>
                            <td className="text-[var(--color-ink-700)]">{d.type}</td>
                            <td>{d.hod_email ? <code className="text-[var(--color-primary-700)] font-mono text-[11px]">{d.hod_email}</code> : <span className="text-slate-400 font-medium">Unassigned</span>}</td>
                            <td>
                              <span className={`premium-badge ${d.is_active ? 'bg-[var(--color-success-tint)] text-[var(--color-success)] border border-[var(--color-success)]/10' : 'bg-[var(--color-danger-tint)] text-[var(--color-danger)] border border-[var(--color-danger)]/10'}`}>
                                {d.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(d)} onDelete={() => handleDelete(d.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subjects' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">Subject Code</th>
                        <th>Subject Name</th>
                        <th>Department</th>
                        <th>Longitudinal?</th>
                        <th>Credits / Units</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No academic subjects found in database. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((s: any) => (
                          <tr key={s.id} className="transition-colors">
                            <td className="pl-5 font-extrabold text-[var(--color-primary-700)] font-mono">{s.code}</td>
                            <td className="font-bold text-[var(--color-ink-900)]">{s.name}</td>
                            <td className="text-[var(--color-ink-700)] font-semibold">{s.department_name || 'General Medical'}</td>
                            <td>
                              {s.is_longitudinal || s.code === 'CM' ? (
                                <span className="premium-badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">YES</span>
                              ) : (
                                <span className="premium-badge bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">NO</span>
                              )}
                            </td>
                            <td className="font-mono text-[var(--color-primary-700)]">{s.credits} Credits</td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(s)} onDelete={() => handleDelete(s.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subject-offerings' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">Subject</th>
                        <th>Prof Year / Phase</th>
                        <th>Delivery Type</th>
                        <th>Batch Year</th>
                        <th>Hours Allotted</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No subject offerings configured. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((o: any) => (
                          <tr key={o.id} className="transition-colors">
                            <td className="pl-5 font-bold text-[var(--color-ink-900)]">
                              {o.subject_name} <span className="text-[var(--color-primary-700)] font-mono text-[11px]">({o.subject_code})</span>
                            </td>
                            <td className="text-[var(--color-ink-700)] font-semibold">{o.prof_name}</td>
                            <td>
                              <span className="premium-badge bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-mono text-[11px]">
                                {o.dtype_code} ({o.dtype_name})
                              </span>
                            </td>
                            <td className="text-[var(--color-ink-700)] font-mono text-[11px]">{o.batch_year} Admission</td>
                            <td className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{o.hours_allotted} hrs</td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(o)} onDelete={() => handleDelete(o.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'delivery-types' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">Code</th>
                        <th>Delivery Type Name</th>
                        <th>Status</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No delivery types registered. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((dt: any) => (
                          <tr key={dt.id} className="transition-colors">
                            <td className="pl-5 font-extrabold text-[var(--color-primary-700)] font-mono">{dt.code}</td>
                            <td className="font-bold text-[var(--color-ink-900)]">{dt.name}</td>
                            <td>
                              <span className={`premium-badge ${dt.is_active ? 'bg-[var(--color-success-tint)] text-[var(--color-success)] border border-[var(--color-success)]/10' : 'bg-[var(--color-danger-tint)] text-[var(--color-danger)] border border-[var(--color-danger)]/10'}`}>
                                {dt.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(dt)} onDelete={() => handleDelete(dt.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'topics' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">Topic Code</th>
                        <th>Topic Name</th>
                        <th>Linked Subject</th>
                        <th>Linked CBME</th>
                        <th>Allocated Hours</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No curriculum topics registered in tenant schema. Click &apos;Add New&apos; to start.</td></tr>
                      ) : (
                        paginatedList.map((t: any) => (
                          <tr key={t.id} className="transition-colors">
                            <td className="pl-5 font-extrabold text-[var(--color-primary-700)] font-mono">{t.code}</td>
                            <td className="font-bold text-[var(--color-ink-900)]">{t.name}</td>
                            <td>
                              {t.subject_name ? (
                                <span className="premium-badge bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                                  {t.subject_name} ({t.subject_code})
                                </span>
                              ) : <span className="text-slate-400">Unassigned</span>}
                            </td>
                            <td>
                              {t.cbme_code ? (
                                <span className="premium-badge bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-bold font-mono">
                                  {t.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{t.hours} hrs</td>
                            <td className="pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(t)} onDelete={() => handleDelete(t.id)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'competencies' && (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th className="pl-5">NMC Code</th>
                        <th>Competency Statement</th>
                        <th>Linked CBME</th>
                        <th>Subject & Topic</th>
                        <th>Blooms Domain</th>
                        <th>Level / Type</th>
                        <th className="pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No medical competencies configured in database. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((c: any) => (
                          <tr key={c.id} className="transition-colors">
                            <td className="pl-5 font-extrabold text-[var(--color-primary-700)] font-mono text-sm">{c.code}</td>
                            <td className="font-semibold text-[var(--color-ink-900)] max-w-md">{c.description}</td>
                            <td>
                              {c.cbme_code ? (
                                <span className="premium-badge bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-bold font-mono">
                                  {c.cbme_code}
                                </span>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="text-[11px]">
                              <div className="font-bold text-[var(--color-ink-700)]">{c.subject_name || 'General'}</div>
                              <div className="text-[var(--color-primary-700)] font-mono">{c.topic_name || 'All Topics'}</div>
                            </td>
                            <td>
                              <span className="premium-badge bg-[var(--color-info-tint)] text-[var(--color-info)] border border-[var(--color-info)]/10">
                                {c.domain || 'Knowledge'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[var(--color-ink-900)] font-extrabold text-xs">{c.level || 'KH'}</span>
                                <span className={`premium-badge ${
                                  c.is_core ? 'bg-[var(--color-warning-tint)] text-[var(--color-warning)] border border-[var(--color-warning)]/10' : 'bg-[var(--color-bg-sunken)] text-[var(--color-ink-500)]'
                                }`}>
                                  {c.is_core ? 'CORE' : 'NON-CORE'}
                                </span>
                              </div>
                            </td>
                            <td className="pr-5 text-right">
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
                  <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-sunken)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--color-ink-700)]">
                    <div>
                      Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border border-[var(--color-border)] disabled:opacity-50 disabled:hover:bg-[var(--color-bg-surface)] transition-all font-bold"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              currentPage === pg
                                ? 'bg-[var(--color-accent-brass)] text-white font-bold'
                                : 'hover:bg-[var(--color-primary-100)] text-[var(--color-ink-700)] hover:text-[var(--color-primary-700)]'
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
                        className="px-3 py-1.5 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border border-[var(--color-border)] disabled:opacity-50 disabled:hover:bg-[var(--color-bg-surface)] transition-all font-bold"
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
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-sunken)]">
                  <h3 className="font-extrabold text-[var(--color-ink-900)] text-base premium-title-display">
                    {editingItem ? `Edit ${activeTab === 'professional-linkers' ? 'CBME Master' : activeTab.replace('-', ' ')}` : `Create New ${activeTab === 'professional-linkers' ? 'CBME Master' : activeTab.replace('-', ' ')}`}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] text-lg font-bold px-2 py-0.5 rounded hover:bg-[var(--color-bg-sunken)] transition-colors">✕</button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-medium">
                  {/* Form fields for ProfessionalLinker */}
                  {activeTab === 'professional-linkers' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">CBME Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. LINK-MBBS-P1" className="premium-input font-mono font-bold" />
                        </div>
                        <div>
                          <label className="premium-label">Course Code</label>
                          <input type="text" value={formData.course_cd || ''} onChange={e => setFormData({ ...formData, course_cd: e.target.value })} placeholder="e.g. MBBS" className="premium-input" />
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">CBME Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="1st Professional Phase I Linker" className="premium-input" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Professional Phase</label>
                          <input type="text" value={formData.professional_phase || ''} onChange={e => setFormData({ ...formData, professional_phase: e.target.value })} placeholder="1st Professional (Phase I)" className="premium-input" />
                        </div>
                        <div>
                          <label className="premium-label">CBME Year (Academic Session)</label>
                          <input type="text" value={formData.academic_session || ''} onChange={e => setFormData({ ...formData, academic_session: e.target.value })} placeholder="2024-2025" className="premium-input font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">Description</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Linking subjects and modules for this academic phase..." className="premium-input h-auto min-h-[80px] resize-none"></textarea>
                      </div>
                    </>
                  )}

                  {/* Form fields for Departments */}
                  {activeTab === 'departments' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Department Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT, MED, SURG" className="premium-input font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="premium-label">Classification Type *</label>
                          <select required value={formData.type || 'Pre-Clinical'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="premium-input">
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
                        <label className="premium-label">Department Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Department of Human Anatomy" className="premium-input" />
                      </div>
                    </>
                  )}

                  {/* Form fields for Subjects */}
                  {activeTab === 'subjects' && (
                    <>
                      <div>
                        <label className="premium-label">Subject Code *</label>
                        <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT-101" className="premium-input font-mono font-bold uppercase" />
                      </div>
                      <div>
                        <label className="premium-label">Subject Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Human Anatomy & Embryology" className="premium-input" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Department</label>
                          <select value={formData.department_id || ''} onChange={e => setFormData({ ...formData, department_id: e.target.value || null })} className="premium-input">
                            <option value="">-- Select Department --</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="premium-label">Course Credits / Units</label>
                          <input type="number" min="1" max="50" value={formData.credits || 4} onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })} className="premium-input font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">Is Longitudinal Subject? *</label>
                        <select
                          required
                          value={formData.is_longitudinal ? 'true' : 'false'}
                          onChange={e => setFormData({ ...formData, is_longitudinal: e.target.value === 'true' })}
                          className="premium-input"
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
                        <label className="premium-label">Select Subject *</label>
                        <select required value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value })} className="premium-input">
                          <option value="">-- Select Subject --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Professional Year / Phase *</label>
                          <select required value={formData.prof_id || ''} onChange={e => setFormData({ ...formData, prof_id: e.target.value })} className="premium-input">
                            <option value="">-- Select Phase --</option>
                            {profPhases.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="premium-label">Delivery Type *</label>
                          <select required value={formData.dtype_id || ''} onChange={e => setFormData({ ...formData, dtype_id: e.target.value })} className="premium-input">
                            <option value="">-- Select Delivery Type --</option>
                            {deliveryTypes.map(dt => (
                              <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Batch Admission Year *</label>
                          <input type="number" required min="2000" max="2100" value={formData.batch_year || 2024} onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })} className="premium-input font-mono" />
                        </div>
                        <div>
                          <label className="premium-label">Hours Allotted</label>
                          <input type="number" min="0" max="1000" value={formData.hours_allotted || 0} onChange={e => setFormData({ ...formData, hours_allotted: Number(e.target.value) })} className="premium-input font-mono" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Delivery Types */}
                  {activeTab === 'delivery-types' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. TH, PR" className="premium-input font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="premium-label">Name *</label>
                          <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Theory, Practical" className="premium-input" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Topics */}
                  {activeTab === 'topics' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Topic Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. ANAT-TOPIC-1" className="premium-input font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="premium-label">Linked Subject</label>
                          <select value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value || null })} className="premium-input">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">Linked CBME Master</label>
                        <select value={formData.linker_id || ''} onChange={e => setFormData({ ...formData, linker_id: e.target.value || null })} className="premium-input">
                          <option value="">-- Select CBME Master --</option>
                          {linkers.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="premium-label">Topic Title / Module Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Upper & Lower Limb Gross Anatomy" className="premium-input" />
                      </div>
                      <div>
                        <label className="premium-label">Description / Syllabus Scope</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Key structures, neurovascular bundles, musculotendinous anatomy..." className="premium-input h-auto min-h-[80px] resize-none"></textarea>
                      </div>
                      <div className="w-1/2 pr-1">
                        <label className="premium-label">Allocated Teaching Hours</label>
                        <input type="number" min="1" max="200" value={formData.hours || 2} onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })} className="premium-input font-mono" />
                      </div>
                    </>
                  )}

                  {/* Form fields for Competency Master */}
                  {activeTab === 'competencies' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">NMC Competency Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. AN1.1, PY2.4" className="premium-input font-mono font-bold uppercase" />
                        </div>
                        <div>
                          <label className="premium-label">Blooms Learning Domain</label>
                          <select value={formData.domain || 'Knowledge'} onChange={e => setFormData({ ...formData, domain: e.target.value })} className="premium-input">
                            <option value="Knowledge">Knowledge (Cognitive)</option>
                            <option value="Skill">Skill (Psychomotor)</option>
                            <option value="Attitude">Attitude (Affective)</option>
                            <option value="Communication">Communication</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">Competency Statement *</label>
                        <textarea rows={2} required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe normal anatomical positions, planes and standard terminology..." className="premium-input h-auto min-h-[60px] resize-none"></textarea>
                      </div>
                      <div>
                        <label className="premium-label">Linked CBME Master</label>
                        <select value={formData.linker_id || ''} onChange={e => setFormData({ ...formData, linker_id: e.target.value || null })} className="premium-input">
                          <option value="">-- Select CBME Master --</option>
                          {linkers.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Subject</label>
                          <select value={formData.subject_id || ''} onChange={e => setFormData({ ...formData, subject_id: e.target.value || null, topic_id: null })} className="premium-input">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="premium-label">Topic</label>
                          <select value={formData.topic_id || ''} onChange={e => setFormData({ ...formData, topic_id: e.target.value || null })} className="premium-input">
                            <option value="">-- Select Topic --</option>
                            {topics.filter(t => !formData.subject_id || t.subject_id === formData.subject_id).map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="premium-label">Mastery Level</label>
                          <select value={formData.level || 'Knows How'} onChange={e => setFormData({ ...formData, level: e.target.value })} className="premium-input font-bold">
                            <option value="Knows">Knows (K)</option>
                            <option value="Knows How">Knows How (KH)</option>
                            <option value="Shows How">Shows How (SH)</option>
                            <option value="Performs">Performs (P)</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-[var(--color-ink-900)] font-bold text-xs select-none">
                            <input type="checkbox" checked={formData.is_core !== false} onChange={e => setFormData({ ...formData, is_core: e.target.checked })} className="w-4 h-4 rounded text-[var(--color-accent-brass)] focus:ring-[var(--color-accent-brass)] bg-[var(--color-bg-sunken)] border-[var(--color-border)]" />
                            Core Competency (NMC Mandatory)
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="premium-btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="premium-btn-accent shadow-sm">
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
