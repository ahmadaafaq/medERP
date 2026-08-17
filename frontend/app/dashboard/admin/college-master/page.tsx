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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return dateStr;
  }
};



interface Group {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  college_name?: string;
  course_id?: string;
  batch_id?: string;
  batch_code?: string;
  department_id?: string;
  department_code?: string;
  department_name?: string;
  capacity?: number;
  is_active: boolean;
}

type SubCategory = 'colleges' | 'courses' | 'professionals' | 'batches' | 'branches' | 'groups' | 'sessions' | 'residencies';

interface College {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active: boolean;
}

interface Course {
  id: string;
  code: string;
  name: string;
  degree_level: string;
  academic_system: 'professional' | 'semester';
  college_id: string;
  college_name: string;
  is_active: boolean;
}

interface ProfessionalPhase {
  id: string;
  college_id: string;
  college_name: string;
  course_id: string;
  course_code: string;
  course_name: string;
  academic_system: 'professional' | 'semester';
  phase_name: string;
  duration_years: number;
  is_active: boolean;
}

interface Batch {
  id: string;
  college_id: string;
  college_name: string;
  course_id: string;
  course_code: string;
  code: string;
  year: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

interface Branch {
  id: string;
  college_id: string;
  college_name: string;
  course_id?: string;
  course_code?: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface AcademicSession {
  id: string;
  college_id: string;
  college_name: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
}

interface ResidencyCategory {
  id: string;
  college_id: string;
  college_name: string;
  course_id?: string;
  course_code?: string;
  residency_type: 'Resident' | 'Hosteller' | 'Day Scholar';
  category_name: string;
  block_wing?: string;
  total_capacity: number;
  allocated_count: number;
  monthly_fee?: number;
  is_active: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1/college-master';

export default function CollegeMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('colleges');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');

  // All data starts empty — loaded from PostgreSQL via API
  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalPhase[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [residencies, setResidencies] = useState<ResidencyCategory[]>([]);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});  // ─── TENANT SLUG RESOLVER ────────────────────────────────────────────────────
  // Strictly enforce the logged-in college tenant slug (No cross-tenant data)
  const getActiveTenantSlug = (): string => {
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem('tenantSlug');
      if (storedSlug) return storedSlug;
    }
    return colleges[0]?.slug || 'srms-ims';
  };

  // Slug for the college currently selected in the form modal
  const getFormCollegeSlug = (): string => {
    return getActiveTenantSlug();
  };

  // ─── ON MOUNT: Load colleges scoped strictly to active tenant ───────────────
  useEffect(() => {
    ['mederp_colleges','mederp_courses','mederp_batches','mederp_branches','mederp_sessions','mederp_residencies','mederp_professionals']
      .forEach((k) => localStorage.removeItem(k));

    const loadColleges = async () => {
      try {
        const storedSlug = (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null) || 'srms-ims';
        const res = await fetch(`${API_BASE}/colleges`);
        if (res.ok) {
          const data = await res.json();
          const list: College[] = (data.data || data || [])
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              domain: t.domain || '',
              plan: t.plan || 'standard',
              primary_color: t.primary_color || '#2D2575',
              is_active: t.is_active ?? true,
            }))
            .filter((c: College) => c.slug === storedSlug);

          if (list.length === 0) {
            const collegeName = (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || storedSlug;
            list.push({
              id: storedSlug,
              name: collegeName,
              slug: storedSlug,
              domain: '',
              plan: 'Enterprise',
              primary_color: '#2D2575',
              is_active: true,
            });
          }

          setColleges(list);
          setSelectedCollegeFilter(list[0].id);
          console.log(`[CollegeMaster] Scoped to active tenant: ${storedSlug} ✅`);
        } else {
          console.error('[CollegeMaster] Failed to load colleges from API');
        }
      } catch (err) {
        console.error('[CollegeMaster] Error loading colleges:', err);
      }
    };

    loadColleges();
  }, []);

  // ─── FETCH TAB DATA ───────────────────────────────────────────────────────────
  // NOTE: tenant slug must match exactly what is in public.tenants.slug
  // Uses getActiveTenantSlug() so the right tenant schema is queried

  const fetchData = async (tab: SubCategory) => {
    // Colleges come from public.tenants — no tenant slug needed
    if (tab === 'colleges') {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const activeSlug = (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null) || 'srms-ims';
        const activeName = (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null);

        const res = await fetch(`${API_BASE}/colleges`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const list: College[] = (data.data || data || [])
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              domain: t.domain || '',
              plan: t.plan || 'standard',
              primary_color: t.primary_color || '#5B4BFF',
              is_active: t.is_active ?? true,
            }))
            .filter((c: College) => c.slug === activeSlug);

          if (list.length === 0) {
            list.push({
              id: activeSlug,
              name: activeName || 'Rajshree Medical Research Institute Bareilly',
              slug: activeSlug,
              domain: '',
              plan: 'Enterprise',
              primary_color: '#5B4BFF',
              is_active: true,
            });
          }

          setColleges(list);
          setSelectedCollegeFilter(list[0].id);
        }
      } catch (err) {
        console.error('[CollegeMaster] Error fetching colleges:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For tenant-scoped tabs, resolve slug dynamically
    const slug = getActiveTenantSlug();
    if (!slug) {
      console.warn('[CollegeMaster] No tenant selected — cannot fetch', tab);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // API_BASE already = '.../api/v1/college-master' so just use the sub-path
      const endpointMap: Record<string, string> = {
        colleges: 'colleges',
        courses: 'courses',
        professionals: 'professionals',
        batches: 'batches',
        branches: 'branches',
        groups: 'groups',
        sessions: 'sessions',
        residencies: 'residencies',
      };
      const endpoint = endpointMap[tab] || tab;
      const res = await fetch(`${API_BASE}/${endpoint}?tenant=${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[CollegeMaster] API ${tab} failed (${res.status}):`, errText);
        return;
      }
      const data = await res.json();
      const list = data.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list)) {
        if (tab === 'courses') setCourses(list);
        if (tab === 'batches') setBatches(list);
        if (tab === 'branches') setBranches(list);
        if (tab === 'groups') setGroups(list);
        if (tab === 'sessions') setSessions(list);
        if (tab === 'residencies') setResidencies(list);
        if (tab === 'professionals') {
          const defaultCollege = colleges[0] || { id: getActiveTenantSlug(), name: (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || 'Medical College' };
          setProfessionals(list.map((p: any) => ({
            id: p.id,
            college_id: p.college_id || defaultCollege?.id || '',
            college_name: defaultCollege?.name || (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || 'Medical College',
            course_id: p.course_cd || 'MBBS',
            course_code: p.course_cd || 'MBBS',
            course_name: 'Bachelor of Medicine, Bachelor of Surgery',
            academic_system: (p.academic_system as any) || 'professional',
            phase_name: p.name,
            duration_years: p.phase_order || 1,
            is_active: p.is_active ?? true,
          })));
        }
      }
    } catch (err) {
      console.error('[CollegeMaster] API connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
    // Batches & Groups & Professionals & Residencies need courses pre-loaded for course mapping dropdowns
    if (['batches', 'groups', 'professionals', 'residencies'].includes(activeTab)) {
      fetchData('courses');
    }
    if (activeTab === 'groups') {
      fetchData('batches');
      fetchData('branches');
    }
  }, [activeTab]);

  // Re-fetch dependencies once colleges load (so slug is available)
  useEffect(() => {
    if (colleges.length > 0) {
      if (['batches', 'groups', 'professionals', 'residencies'].includes(activeTab)) {
        fetchData('courses');
      }
      if (activeTab === 'groups') {
        fetchData('batches');
        fetchData('branches');
      }
    }
  }, [colleges]);

  // Helper: Available Courses under currently selected Form College
  const getCoursesForCollege = (collegeId: string) => {
    return courses.filter((c) => c.college_id === collegeId);
  };

  // Open Modal to Add New Item (Preselect College & Course)
  const handleAddNew = () => {
    setEditingItem(null);
    const defaultCollegeId = selectedCollegeFilter !== 'all' ? selectedCollegeFilter : colleges[0]?.id || '';
    const collegeCourses = getCoursesForCollege(defaultCollegeId);
    const defaultCourse = collegeCourses[0] || courses[0];
    const defaultCourseId = defaultCourse?.id || '';

    if (activeTab === 'colleges') {
      setFormData({ name: '', slug: '', domain: '', plan: 'Enterprise', primaryColor: '#6366F1' });
    } else if (activeTab === 'courses') {
      setFormData({ collegeId: defaultCollegeId, code: '', name: '', degreeLevel: 'UG', academicSystem: 'professional' });
    } else if (activeTab === 'professionals') {
      const isProf = defaultCourse?.academic_system !== 'semester';
      setFormData({
        collegeId: defaultCollegeId,
        courseId: defaultCourseId,
        phaseName: isProf ? '1st Professional MBBS (Phase I)' : 'Semester 1 (1st Year)',
        durationYears: isProf ? 1.5 : 0.5,
      });
    } else if (activeTab === 'batches') {
      setFormData({ collegeId: defaultCollegeId, courseId: defaultCourseId, code: '', year: 2024, startDate: '', endDate: '' });
    } else if (activeTab === 'branches') {
      setFormData({ collegeId: defaultCollegeId, courseId: defaultCourseId, code: '', name: '', type: 'Clinical' });
    } else if (activeTab === 'groups') {
      // Ensure dependent data is loaded for the cascading dropdowns
      if (courses.length === 0) fetchData('courses');
      if (batches.length === 0) fetchData('batches');
      if (branches.length === 0) fetchData('branches');
      setFormData({
        collegeId: defaultCollegeId,
        courseId: defaultCourseId,
        batchId: '',          // user picks via cascade
        departmentId: '',     // optional
        code: '',
        name: '',
        capacity: 50,
      });
    } else if (activeTab === 'sessions') {
      setFormData({ collegeId: defaultCollegeId, name: '', startDate: '', endDate: '', isCurrent: false });
    } else if (activeTab === 'residencies') {
      setFormData({
        collegeId: defaultCollegeId,
        courseId: defaultCourseId,
        residencyType: 'Hosteller',
        categoryName: '',
        blockWing: '',
        totalCapacity: 100,
        allocatedCount: 0,
        monthlyFee: 10000,
      });
    }
    setIsModalOpen(true);
  };

  // Open Modal to Edit Item
  const handleEdit = (item: any) => {
    setEditingItem(item);
    // For batches: reverse-lookup courseId UUID from course_code string (e.g. 'MBBS' → UUID)
    const resolvedCourseId =
      item.course_id || item.courseId ||
      (activeTab === 'batches'
        ? courses.find(c => c.code === (item.course_code || item.course_cd))?.id || ''
        : '');

    const rawStartDate = item.start_date || item.startDate || '';
    const rawEndDate = item.end_date || item.endDate || '';
    const startDate = rawStartDate && rawStartDate !== '—' ? formatDate(rawStartDate) : '';
    const endDate = rawEndDate && rawEndDate !== '—' ? formatDate(rawEndDate) : '';

    setFormData({
      ...item,
      collegeId: item.college_id || item.collegeId || colleges[0]?.id,
      courseId: resolvedCourseId,
      startDate,
      endDate,
      isCurrent: item.is_current ?? item.isCurrent ?? false,
      phaseName: item.phase_name || item.phaseName || '',
      durationYears: item.duration_years || item.durationYears || 1.0,
      academicSystem: item.academic_system || item.academicSystem || 'professional',
      residencyType: item.residency_type || item.residencyType || 'Hosteller',
      categoryName: item.category_name || item.categoryName || '',
      blockWing: item.block_wing || item.blockWing || '',
      totalCapacity: item.total_capacity || item.totalCapacity || 100,
      allocatedCount: item.allocated_count || item.allocatedCount || 0,
      monthlyFee: item.monthly_fee || item.monthlyFee || 0,
    });
    setIsModalOpen(true);
  };

  // Handle Form College Change -> Automatically update Cascading Course Dropdown
  const handleFormCollegeChange = (cId: string) => {
    const availableCourses = getCoursesForCollege(cId);
    const firstCourse = availableCourses[0] || courses[0];
    const firstCourseId = firstCourse?.id || '';
    const isProf = firstCourse?.academic_system !== 'semester';
    setFormData({
      ...formData,
      collegeId: cId,
      courseId: firstCourseId,
      phaseName: isProf ? '1st Professional MBBS (Phase I)' : 'Semester 1 (1st Year)',
      durationYears: isProf ? 1.5 : 0.5,
    });
  };

  // Handle Form Course Change -> Automatically determine Professional vs Semester options
  const handleFormCourseChange = (crsId: string) => {
    const selectedCourse = courses.find((c) => c.id === crsId);
    const isProf = selectedCourse?.academic_system !== 'semester';
    setFormData({
      ...formData,
      courseId: crsId,
      phaseName: isProf ? '1st Professional MBBS (Phase I)' : 'Semester 1 (1st Year)',
      durationYears: isProf ? 1.5 : 0.5,
    });
  };

  // Local State Update Fallback (React memory only)
  const updateLocalStateFallback = (isEdit: boolean) => {
    const targetId = editingItem?.id || editingItem?.slug || String(Date.now());

    if (activeTab === 'colleges') {
      const updatedCollege: College = {
        id: targetId,
        name: formData.name || editingItem?.name || 'New College',
        slug: formData.slug || editingItem?.slug || 'slug',
        domain: formData.domain || editingItem?.domain || '',
        plan: formData.plan || editingItem?.plan || 'Enterprise',
        primary_color: formData.primaryColor || formData.primary_color || editingItem?.primary_color || '#6366F1',
        is_active: formData.is_active ?? editingItem?.is_active ?? true,
      };

      setColleges((prev) => {
        const next = isEdit
          ? prev.map((c) => (c.id === targetId || c.slug === targetId ? updatedCollege : c))
          : [updatedCollege, ...prev];
        return next;
      });

      if (isEdit) {
        const oldCollegeName = editingItem?.name;
        setCourses((prev) => {
          const next = prev.map((crs) => (crs.college_id === targetId || crs.college_name === oldCollegeName ? { ...crs, college_name: updatedCollege.name } : crs));
          return next;
        });
        setProfessionals((prev) => {
          const next = prev.map((p) => (p.college_id === targetId || p.college_name === oldCollegeName ? { ...p, college_name: updatedCollege.name } : p));
          return next;
        });
        setBatches((prev) => {
          const next = prev.map((b) => (b.college_id === targetId || b.college_name === oldCollegeName ? { ...b, college_name: updatedCollege.name } : b));
          return next;
        });
        setBranches((prev) => {
          const next = prev.map((br) => (br.college_id === targetId || br.college_name === oldCollegeName ? { ...br, college_name: updatedCollege.name } : br));
          return next;
        });
        setSessions((prev) => {
          const next = prev.map((s) => (s.college_id === targetId || s.college_name === oldCollegeName ? { ...s, college_name: updatedCollege.name } : s));
          return next;
        });
        setResidencies((prev) => {
          const next = prev.map((r) => (r.college_id === targetId || r.college_name === oldCollegeName ? { ...r, college_name: updatedCollege.name } : r));
          return next;
        });
      }
      return;
    }

    const selectedCollege = colleges.find((c) => c.id === formData.collegeId) || colleges[0];
    const college_id = selectedCollege?.id;
    const college_name = selectedCollege?.name;

    const availableCourses = getCoursesForCollege(college_id);
    const selectedCourse = availableCourses.find((c) => c.id === formData.courseId) || availableCourses[0] || courses[0];
    const course_id = selectedCourse?.id;
    const course_code = selectedCourse?.code;
    const course_name = selectedCourse?.name;
    const academic_system = selectedCourse?.academic_system || (formData.academicSystem as any) || 'professional';

    if (activeTab === 'courses') {
      const item: Course = {
        id: targetId,
        code: formData.code || 'CODE',
        name: formData.name || 'Course Title',
        degree_level: formData.degreeLevel || 'UG',
        academic_system: formData.academicSystem || 'professional',
        college_id,
        college_name,
        is_active: true,
      };
      setCourses((prev) => {
        const next = isEdit ? prev.map((c) => (c.id === targetId ? item : c)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'professionals') {
      const item: ProfessionalPhase = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        course_name,
        academic_system,
        phase_name: formData.phaseName || (academic_system === 'semester' ? 'Semester 1 (1st Year)' : '1st Professional MBBS (Phase I)'),
        duration_years: Number(formData.durationYears) || (academic_system === 'semester' ? 0.5 : 1.5),
        is_active: true,
      };
      setProfessionals((prev) => {
        const next = isEdit ? prev.map((p) => (p.id === targetId ? item : p)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'batches') {
      const item: Batch = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        code: formData.code || 'BATCH',
        year: Number(formData.year) || 2024,
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_active: true,
      };
      setBatches((prev) => {
        const next = isEdit ? prev.map((b) => (b.id === targetId ? item : b)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'branches') {
      const item: Branch = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        code: formData.code || 'BRANCH',
        name: formData.name || 'Branch Name',
        type: formData.type || 'Clinical',
        is_active: true,
      };
      setBranches((prev) => {
        const next = isEdit ? prev.map((b) => (b.id === targetId ? item : b)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'sessions') {
      const item: AcademicSession = {
        id: targetId,
        college_id,
        college_name,
        name: formData.name || 'Session Name',
        start_date: formData.startDate || '',
        end_date: formData.endDate || '',
        is_current: Boolean(formData.isCurrent),
        is_active: true,
      };
      setSessions((prev) => {
        const next = isEdit ? prev.map((s) => (s.id === targetId ? item : s)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'residencies') {
      const item: ResidencyCategory = {
        id: targetId,
        college_id,
        college_name,
        residency_type: formData.residencyType || 'Hosteller',
        category_name: formData.categoryName || 'New Residency Block',
        block_wing: formData.blockWing || '',
        total_capacity: Number(formData.totalCapacity) || 100,
        allocated_count: Number(formData.allocatedCount) || 0,
        monthly_fee: Number(formData.monthlyFee) || 0,
        is_active: true,
      };
      setResidencies((prev) => {
        const next = isEdit ? prev.map((r) => (r.id === targetId ? item : r)) : [item, ...prev];
        return next;
      });
    }
  };

  // Save Record — writes to PostgreSQL via backend API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = Boolean(editingItem);
    const method = isEdit ? 'PUT' : 'POST';
    const recordId = editingItem?.id || editingItem?.slug || '';

    // Colleges → public schema endpoint, no tenant slug needed
    if (activeTab === 'colleges') {
      const url = isEdit ? `${API_BASE}/colleges/${recordId}` : `${API_BASE}/colleges`;
      const cleanSlug = (formData.slug || formData.name || 'college').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const bodyPayload: Record<string, any> = {
        name: formData.name,
        slug: cleanSlug,
        domain: formData.domain || undefined,
        plan: formData.plan || 'Enterprise',
        primaryColor: formData.primaryColor || formData.primary_color || '#5B4BFF',
      };
      if (isEdit) {
        bodyPayload.isActive = formData.is_active ?? formData.isActive ?? true;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(bodyPayload),
        });
        if (res.ok) {
          console.log('[CollegeMaster] College saved to public.tenants ✅');
          await fetchData('colleges');
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.message || (await res.text().catch(() => 'Save failed'));
          console.error('[CollegeMaster] College save failed:', errMsg);
          alert(`Save failed: ${Array.isArray(errMsg) ? errMsg.join(', ') : errMsg}`);
        }
      } catch (err) {
        console.error('[CollegeMaster] Network error:', err);
        alert('Network connection error when saving college');
      }
      setIsModalOpen(false);
      return;
    }

    // Tenant-scoped tabs: use the slug of the college selected in the form
    const slug = getFormCollegeSlug();
    if (!slug) {
      alert('Please select a college first.');
      return;
    }

    const saveEndpointMap: Record<string, string> = {
      courses: 'courses',
      professionals: 'professionals',
      batches: 'batches',
      branches: 'branches',
      groups: 'groups',
      sessions: 'sessions',
      residencies: 'residencies',
    };
    const saveEndpoint = saveEndpointMap[activeTab] || activeTab;
    const url = isEdit
      ? `${API_BASE}/${saveEndpoint}/${recordId}?tenant=${slug}`
      : `${API_BASE}/${saveEndpoint}?tenant=${slug}`;

    let bodyPayload: Record<string, any> = { ...formData };
    if (activeTab === 'courses') {
      bodyPayload = {
        code: formData.code,
        name: formData.name,
        degreeLevel: formData.degreeLevel || 'UG',
        durationYears: Number(formData.durationYears) || 5,
        professionalPhase: formData.phaseName || '1st Professional (Phase I)',
        academicSystem: formData.academicSystem || 'professional',
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'professionals') {
      bodyPayload = {
        name: formData.phaseName || '1st Professional MBBS (Phase I)',
        phaseOrder: Number(formData.durationYears) || 1,
        courseCd: formData.courseCode || 'MBBS',
        academicSystem: formData.academicSystem || 'professional',
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'batches') {
      // Derive the course code string from the selected courseId UUID
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const courseCd = selectedCourse?.code || formData.courseCode || formData.course_code || formData.course_cd || '';
      if (!courseCd) {
        alert('Please select a Course to map this Batch to.');
        return;
      }
      bodyPayload = {
        code: formData.code,
        year: Number(formData.year) || new Date().getFullYear(),
        courseCd,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'branches') {
      bodyPayload = {
        code: formData.code,
        name: formData.name,
        type: formData.type || 'Clinical',
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'sessions') {
      bodyPayload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: Boolean(formData.isCurrent),
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'groups') {
      bodyPayload = {
        code: formData.code,
        name: formData.name,
        collegeId: formData.collegeId,
        courseId: formData.courseId || null,
        batchId: formData.batchId || null,
        departmentId: formData.departmentId || null,
        capacity: Number(formData.capacity) || 50,
      };
    } else if (activeTab === 'residencies') {
      bodyPayload = {
        residencyType: formData.residencyType || 'Hosteller',
        categoryName: formData.categoryName || 'Hostel Block',
        blockWing: formData.blockWing || '',
        totalCapacity: Number(formData.totalCapacity) || 100,
        allocatedCount: Number(formData.allocatedCount) || 0,
        monthlyFee: Number(formData.monthlyFee) || 0,
        collegeId: formData.collegeId,
        courseId: formData.courseId || null,
        courseCode: formData.courseCode || formData.course_code || 'ALL',
      };
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        console.log(`[CollegeMaster] Saved ${activeTab} to tenant_${slug} in PostgreSQL ✅`);
        await fetchData(activeTab);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || (await res.text().catch(() => 'Save failed'));
        console.error(`[CollegeMaster] Save ${activeTab} failed (${res.status}):`, errMsg);
        alert(`Save failed: ${Array.isArray(errMsg) ? errMsg.join(', ') : errMsg}`);
      }
    } catch (err) {
      console.error('[CollegeMaster] Network error during save:', err);
      alert(`Network error saving ${activeTab}`);
    }

    setIsModalOpen(false);
  };

  // Delete Record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    if (activeTab === 'colleges') {
      // Colleges are in public.tenants — no tenant slug
      try {
        await fetch(`${API_BASE}/colleges/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('[CollegeMaster] Delete college error:', err);
      }
      setColleges((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    // Tenant-scoped: use the slug of the college owning this record
    const slug = getActiveTenantSlug();
    const token = localStorage.getItem('token') || '';
    const endpointMap: Record<string, string> = {
      colleges: 'colleges',
      courses: 'courses',
      professionals: 'professionals',
      batches: 'batches',
      branches: 'branches',
      groups: 'groups',
      sessions: 'sessions',
      residencies: 'residencies',
    };
    const endpoint = endpointMap[activeTab] || activeTab;

    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${id}?tenant=${slug}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        console.log(`[CollegeMaster] Deleted ${activeTab} ${id} successfully ✅`);
        await fetchData(activeTab);
      } else {
        const errText = await res.text();
        console.error(`[CollegeMaster] Delete ${activeTab} failed (${res.status}):`, errText);
        alert(`Delete failed: ${errText}`);
      }
    } catch (err) {
      console.warn('[CollegeMaster] API error during delete:', err);
    }

    if (activeTab === 'courses') {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } else if (activeTab === 'professionals') {
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
    } else if (activeTab === 'batches') {
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } else if (activeTab === 'branches') {
      setBranches((prev) => prev.filter((b) => b.id !== id));
    } else if (activeTab === 'groups') {
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } else if (activeTab === 'sessions') {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } else if (activeTab === 'residencies') {
      setResidencies((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Helper filter by search term AND selected college filter
  const isMatchCollege = (itemCollegeId?: string) => {
    if (selectedCollegeFilter === 'all') return true;
    return !itemCollegeId || itemCollegeId === selectedCollegeFilter;
  };

  // Sub-Category Definition Tabs
  const categories = [
    { key: 'colleges', label: '1. College', icon: '🏢', count: colleges.length },
    { key: 'courses', label: '2. Courses', icon: '🎓', count: courses.filter((c) => isMatchCollege(c.college_id)).length },
    { key: 'professionals', label: '3. Professional / Semester', icon: '🩺', count: professionals.filter((p) => isMatchCollege(p.college_id)).length },
    { key: 'batches', label: '4. Batch', icon: '📅', count: batches.filter((b) => isMatchCollege(b.college_id)).length },
    { key: 'branches', label: '5. Departments & Specialties', icon: '🩺', count: branches.filter((br) => isMatchCollege(br.college_id)).length },
    { key: 'groups', label: '6. Group Master', icon: '👥', count: groups.filter((g) => isMatchCollege(g.college_id)).length },
    { key: 'sessions', label: '7. Session', icon: '⏱️', count: sessions.filter((s) => isMatchCollege(s.college_id)).length },
    { key: 'residencies', label: '8. Residency Category', icon: '🏥', count: residencies.filter((r) => isMatchCollege(r.college_id)).length },
  ];

  // Currently selected course object inside Form for dynamic rendering
  const formSelectedCourse = courses.find((c) => c.id === formData.courseId) || getCoursesForCollege(formData.collegeId || colleges[0]?.id)[0];
  const isSelectedCourseSemesterSystem = formSelectedCourse?.academic_system === 'semester';

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="CollegeMaster — College-Wise Residency & Student Types" />

        <main className="p-6 space-y-6 flex-1">
          {/* 7 Category Tabs — Clean Grid Layout (No Horizontal Scrollbar) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 border-b border-slate-200 dark:border-slate-300 dark:border-slate-800 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveTab(cat.key as SubCategory); setSearchTerm(''); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left ${
                  activeTab === cat.key
                    ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : 'bg-white dark:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-200 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-300 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate text-[11px] font-bold">{cat.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                  activeTab === cat.key ? 'bg-white/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Top Controls: Filter by College & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Active College Badge (Locked to authenticated tenant) */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs shadow-sm shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <span>🏛️</span> Active College:
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 max-w-[220px] truncate">
                  {colleges[0]?.name || (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || 'Current Institution'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  tenant_{getActiveTenantSlug()}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder={`Search in ${categories.find((c) => c.key === activeTab)?.label}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-white dark:bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <svg className="w-4 h-4 absolute right-3 top-2.5 text-slate-600 dark:text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Add New Button */}
              <button
                onClick={handleAddNew}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New {categories.find((c) => c.key === activeTab)?.label.split('. ')[1]}
              </button>
            </div>

            <button
              onClick={() => fetchData(activeTab)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-200/80 dark:bg-slate-200 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <span>🔄</span> Re-Sync Database
            </button>
          </div>

          {/* Master DataTable */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-100 dark:bg-white dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-300 dark:border-slate-800">
                    {activeTab === 'colleges' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">College Name</th>
                        <th className="p-4 whitespace-nowrap">Slug Code</th>
                        <th className="p-4 whitespace-nowrap">Domain</th>
                        <th className="p-4 whitespace-nowrap">Plan</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'courses' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Course Code</th>
                        <th className="p-4 whitespace-nowrap">Course Master Title</th>
                        <th className="p-4 whitespace-nowrap">Degree Level</th>
                        <th className="p-4 whitespace-nowrap">Academic System Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'professionals' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">System Type</th>
                        <th className="p-4 whitespace-nowrap">Professional Phase / Semester Title</th>
                        <th className="p-4 whitespace-nowrap">Duration</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'batches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Batch Code</th>
                        <th className="p-4 whitespace-nowrap">Admission Year</th>
                        <th className="p-4 whitespace-nowrap">Duration Dates</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'branches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Department Code</th>
                        <th className="p-4 whitespace-nowrap">Department / Specialty Name</th>
                        <th className="p-4 whitespace-nowrap">Specialty Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'groups' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Group Code</th>
                        <th className="p-4 whitespace-nowrap">Group Title / Name</th>
                        <th className="p-4 whitespace-nowrap">Assigned Batch</th>
                        <th className="p-4 whitespace-nowrap">Branch / Department</th>
                        <th className="p-4 whitespace-nowrap">Capacity</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sessions' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Session Title</th>
                        <th className="p-4 whitespace-nowrap">Start Date</th>
                        <th className="p-4 whitespace-nowrap">End Date</th>
                        <th className="p-4 whitespace-nowrap">Current Session</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'residencies' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Residency Type</th>
                        <th className="p-4 whitespace-nowrap">Hostel Block / Category Title</th>
                        <th className="p-4 whitespace-nowrap">Block / Wing Info</th>
                        <th className="p-4 whitespace-nowrap">Occupancy / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Monthly Fee</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <TableSkeleton colCount={
                    activeTab === 'residencies' ? 9 :
                    activeTab === 'professionals' || activeTab === 'batches' || activeTab === 'branches' || activeTab === 'courses' || activeTab === 'sessions' ? 7 :
                    6
                  } />
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-100 dark:bg-white dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-300 dark:border-slate-800">
                    {activeTab === 'colleges' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">College Name</th>
                        <th className="p-4 whitespace-nowrap">Slug Code</th>
                        <th className="p-4 whitespace-nowrap">Domain</th>
                        <th className="p-4 whitespace-nowrap">Plan</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'courses' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Course Code</th>
                        <th className="p-4 whitespace-nowrap">Course Master Title</th>
                        <th className="p-4 whitespace-nowrap">Degree Level</th>
                        <th className="p-4 whitespace-nowrap">Academic System Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'professionals' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">System Type</th>
                        <th className="p-4 whitespace-nowrap">Professional Phase / Semester Title</th>
                        <th className="p-4 whitespace-nowrap">Duration</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'batches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Batch Code</th>
                        <th className="p-4 whitespace-nowrap">Admission Year</th>
                        <th className="p-4 whitespace-nowrap">Duration Dates</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'branches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Department Code</th>
                        <th className="p-4 whitespace-nowrap">Department / Specialty Name</th>
                        <th className="p-4 whitespace-nowrap">Specialty Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sessions' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Session Title</th>
                        <th className="p-4 whitespace-nowrap">Start Date</th>
                        <th className="p-4 whitespace-nowrap">End Date</th>
                        <th className="p-4 whitespace-nowrap">Current Session</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'residencies' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Residency Type</th>
                        <th className="p-4 whitespace-nowrap">Hostel Block / Category Title</th>
                        <th className="p-4 whitespace-nowrap">Block / Wing Info</th>
                        <th className="p-4 whitespace-nowrap">Occupancy / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Monthly Fee</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {/* 1. COLLEGES */}
                    {activeTab === 'colleges' &&
                      colleges
                        .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((col) => (
                          <tr key={col.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.primary_color || '#6366F1' }} />
                                <span>{col.name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">{col.slug}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-600 dark:text-slate-400">{col.domain || 'N/A'}</td>
                            <td className="p-4 whitespace-nowrap"><span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">{col.plan || 'Standard'}</span></td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${col.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {col.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(col)} onDelete={() => handleDelete(col.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 2. COURSES */}
                    {activeTab === 'courses' &&
                      courses
                        .filter((c) => isMatchCollege(c.college_id))
                        .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((crs) => (
                          <tr key={crs.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === crs.college_id)?.name || crs.college_name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{crs.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{crs.name}</td>
                            <td className="p-4 whitespace-nowrap"><span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">{crs.degree_level || 'UG'}</span></td>
                            <td className="p-4 whitespace-nowrap">
                              {crs.academic_system === 'semester' ? (
                                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                                  📚 Semester System
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold text-[11px]">
                                  🩺 Professional Phase
                                </span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${crs.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {crs.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(crs)} onDelete={() => handleDelete(crs.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 3. PROFESSIONAL / SEMESTER PHASES */}
                    {activeTab === 'professionals' &&
                      professionals
                        .filter((p) => isMatchCollege(p.college_id))
                        .filter((p) => p.phase_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.course_code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((pf) => (
                          <tr key={pf.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === pf.college_id)?.name || pf.college_name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              🎓 {pf.course_code}
                            </td>
                            <td className="p-4 font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {pf.academic_system === 'semester' ? '📚 Semester' : '🩺 Professional'}
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded font-extrabold text-[11px] border ${
                                pf.academic_system === 'semester'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
                              }`}>
                                {pf.academic_system === 'semester' ? '📚 ' : '🩺 '} {pf.phase_name}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {pf.duration_years} Years
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${pf.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {pf.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(pf)} onDelete={() => handleDelete(pf.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 4. BATCHES */}
                    {activeTab === 'batches' &&
                      batches
                        .filter((b) => isMatchCollege(b.college_id))
                        .filter((b) => b.code.toLowerCase().includes(searchTerm.toLowerCase()) || (b.course_code || (b as any).course_cd || '').toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((bth) => (
                          <tr key={bth.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === bth.college_id)?.name || bth.college_name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-indigo-600 dark:text-indigo-300 font-bold font-mono whitespace-nowrap">
                              {bth.course_code || (bth as any).course_cd ? (
                                `🎓 ${bth.course_code || (bth as any).course_cd}`
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  ⚠️ Unmapped Course
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{bth.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white whitespace-nowrap">{bth.year}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(bth.start_date)} - {formatDate(bth.end_date)}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${bth.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {bth.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(bth)} onDelete={() => handleDelete(bth.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 5. BRANCHES */}
                    {/* 5. DEPARTMENTS & SPECIALTIES */}
                    {activeTab === 'branches' &&
                      branches
                        .filter((br) => isMatchCollege(br.college_id))
                        .filter((br) => br.name.toLowerCase().includes(searchTerm.toLowerCase()) || br.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((br) => (
                          <tr key={br.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === br.college_id)?.name || br.college_name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{br.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{br.name}</td>
                            <td className="p-4 whitespace-nowrap"><span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">{br.type}</span></td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${br.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {br.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(br)} onDelete={() => handleDelete(br.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 6. GROUPS */}
                    {activeTab === 'groups' &&
                      groups
                        .filter((g) => isMatchCollege(g.college_id))
                        .filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((grp) => {
                          const course = courses.find((c) => c.id === grp.course_id);
                          const batch = batches.find((b) => b.id === grp.batch_id);
                          return (
                            <tr key={grp.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  <span>{colleges.find((c) => c.id === grp.college_id)?.name || grp.college_name || 'srms-ims'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-indigo-600 dark:text-indigo-300 font-bold font-mono whitespace-nowrap">
                                🎓 {course?.code || (grp as any).course_code || 'MBBS'}
                              </td>
                              <td className="p-4 font-bold font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">{grp.code}</td>
                              <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{grp.name}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs">
                                  Batch {grp.batch_code || batch?.code || '2025'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                {grp.department_name && grp.department_name !== 'None' ? `${grp.department_name} (${grp.department_code})` : 'All Departments / General'}
                              </td>
                              <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                👥 {grp.capacity || 50} Students
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${grp.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                  {grp.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                                <ActionButtons onEdit={() => handleEdit(grp)} onDelete={() => handleDelete(grp.id)} />
                              </td>
                            </tr>
                          );
                        })}

                    {/* 6. SESSIONS */}
                    {activeTab === 'sessions' &&
                      sessions
                        .filter((s) => isMatchCollege(s.college_id))
                        .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((ses) => (
                          <tr key={ses.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === ses.college_id)?.name || ses.college_name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{ses.name}</td>
                            <td className="p-4 text-slate-700 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(ses.start_date)}</td>
                            <td className="p-4 text-slate-700 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(ses.end_date)}</td>
                            <td className="p-4 whitespace-nowrap">
                              {ses.is_current ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">CURRENT SESSION</span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-400 text-xs">Standard</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${ses.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {ses.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(ses)} onDelete={() => handleDelete(ses.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 7. RESIDENCY / HOSTELLER / DAY SCHOLAR */}
                    {activeTab === 'residencies' &&
                      residencies
                        .filter((r) => isMatchCollege(r.college_id))
                        .filter((r) => r.category_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.residency_type.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((resItem) => {
                          const fillPct = Math.min(100, Math.round((resItem.allocated_count / (resItem.total_capacity || 1)) * 100));
                          return (
                            <tr key={resItem.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  <span>{colleges.find((c) => c.id === resItem.college_id)?.name || resItem.college_name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-indigo-600 dark:text-indigo-300 font-bold font-mono whitespace-nowrap">
                                🎓 {resItem.course_code || 'ALL'}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {resItem.residency_type === 'Resident' && (
                                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-extrabold text-[11px]">
                                    🩺 PG Resident
                                  </span>
                                )}
                                {resItem.residency_type === 'Hosteller' && (
                                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-extrabold text-[11px]">
                                    🏠 Hosteller Inmate
                                  </span>
                                )}
                                {resItem.residency_type === 'Day Scholar' && (
                                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-extrabold text-[11px]">
                                    🚌 Day Scholar
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{resItem.category_name}</td>
                              <td className="p-4 text-slate-500 dark:text-slate-600 dark:text-slate-400 whitespace-nowrap">{resItem.block_wing || 'General Block'}</td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="space-y-1 min-w-[120px]">
                                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300">
                                    <span>{resItem.allocated_count} / {resItem.total_capacity}</span>
                                    <span>{fillPct}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        fillPct > 90 ? 'bg-rose-500' : fillPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${fillPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                ₹{(resItem.monthly_fee || 0).toLocaleString('en-IN')}/mo
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${resItem.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                  {resItem.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                                <ActionButtons onEdit={() => handleEdit(resItem)} onDelete={() => handleDelete(resItem.id)} />
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dynamic Add / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg p-6 space-y-6 shadow-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-300 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-900 dark:text-white">
                {editingItem ? 'Edit' : 'Add New'} {categories.find((c) => c.key === activeTab)?.label.split('. ')[1]}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-900 dark:text-white font-bold text-base">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* STEP 1: Mandatory Select College Dropdown */}
              {activeTab !== 'colleges' && (
                <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                    <span>1st Priority: Select College *</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Mapped College ID</span>
                  </label>
                  <select
                    required
                    value={formData.collegeId || colleges[0]?.id}
                    onChange={(e) => handleFormCollegeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        🏛️ {col.name} ({col.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* STEP 2: Mandatory Cascading Select Course Dropdown */}
              {['professionals', 'batches', 'branches', 'residencies'].includes(activeTab) && (
                <div className="space-y-1 bg-slate-50 dark:bg-white/60 dark:bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-300 dark:border-slate-800">
                  <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                    <span>2nd Priority: Select Course *</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-normal">Filtered by Selected College</span>
                  </label>
                  <select
                    required
                    value={formData.courseId || getCoursesForCollege(formData.collegeId || colleges[0]?.id)[0]?.id}
                    onChange={(e) => handleFormCourseChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {getCoursesForCollege(formData.collegeId || colleges[0]?.id).map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        🎓 {crs.code} — {crs.name} ({crs.academic_system === 'semester' ? 'Semester System' : 'Professional Phase'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* COLLEGE FORM */}
              {activeTab === 'colleges' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">College Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AIIMS New Delhi"
                      value={formData.name || ''}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const autoSlug = newName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setFormData({
                          ...formData,
                          name: newName,
                          slug: editingItem ? formData.slug : (formData.slugAutoModified ? formData.slug : autoSlug),
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Slug Code * (Schema ID)</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingItem)}
                        placeholder="e.g. aiims-delhi"
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          slugAutoModified: true,
                        })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Domain (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. aiims.edu.in"
                        value={formData.domain || ''}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Plan</label>
                      <select value={formData.plan || 'Enterprise'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white">
                        <option value="Enterprise">Enterprise</option>
                        <option value="Standard">Standard</option>
                        <option value="Starter">Starter</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Primary Color</label>
                      <input type="color" value={formData.primary_color || formData.primaryColor || '#6366F1'} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value, primary_color: e.target.value })} className="w-full h-9 p-1 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded cursor-pointer" />
                    </div>
                  </div>
                </>
              )}

              {/* COURSE FORM */}
              {activeTab === 'courses' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Course Code *</label>
                      <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-mono" placeholder="e.g. MBBS / BAMS / BTECH-CS" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Degree Level</label>
                      <select value={formData.degreeLevel || 'UG'} onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white">
                        <option value="UG">Undergraduate (UG)</option>
                        <option value="PG">Postgraduate (PG)</option>
                        <option value="Diploma">Diploma / Paramedical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Course Master Title *</label>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white" placeholder="e.g. Bachelor of Medicine and Bachelor of Surgery" />
                  </div>

                  <div className="space-y-1 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                      <span>Academic System Type *</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Controls Professional vs Semester Setup</span>
                    </label>
                    <select
                      value={formData.academicSystem || 'professional'}
                      onChange={(e) => setFormData({ ...formData, academicSystem: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                    >
                      <option value="professional">🩺 Professional-wise System (MBBS / BAMS / BUMS / PG Medical)</option>
                      <option value="semester">📚 Semester-wise System (B.Tech / B.Sc / B.Pharm / MBA)</option>
                    </select>
                  </div>
                </>
              )}

              {/* DYNAMIC FORM FOR PROFESSIONAL / SEMESTER SETUP */}
              {activeTab === 'professionals' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
                      <span>{isSelectedCourseSemesterSystem ? '📚 Select Semester Title *' : '🩺 Select Professional Phase Title *'}</span>
                    </label>
                    {isSelectedCourseSemesterSystem ? (
                      <select
                        value={formData.phaseName || 'Semester 1 (1st Year)'}
                        onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                      >
                        <option value="Semester 1 (1st Year)">Semester 1 (1st Year)</option>
                        <option value="Semester 2 (1st Year)">Semester 2 (1st Year)</option>
                        <option value="Semester 3 (2nd Year)">Semester 3 (2nd Year)</option>
                        <option value="Semester 4 (2nd Year)">Semester 4 (2nd Year)</option>
                        <option value="Semester 5 (3rd Year)">Semester 5 (3rd Year)</option>
                        <option value="Semester 6 (3rd Year)">Semester 6 (3rd Year)</option>
                        <option value="Semester 7 (4th Year)">Semester 7 (4th Year)</option>
                        <option value="Semester 8 (4th Year)">Semester 8 (4th Year)</option>
                      </select>
                    ) : (
                      <select
                        value={formData.phaseName || '1st Professional MBBS (Phase I)'}
                        onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                      >
                        <option value="1st Professional MBBS (Phase I)">1st Professional MBBS (Phase I)</option>
                        <option value="2nd Professional MBBS (Phase II)">2nd Professional MBBS (Phase II)</option>
                        <option value="3rd Professional MBBS Part I (Phase III-1)">3rd Professional MBBS Part I (Phase III Part I)</option>
                        <option value="3rd Professional MBBS Part II (Final MBBS)">3rd Professional MBBS Part II (Final MBBS / Phase III Part II)</option>
                        <option value="BAMS 1st Professional Phase">BAMS 1st Professional Phase</option>
                        <option value="BAMS 2nd Professional Phase">BAMS 2nd Professional Phase</option>
                        <option value="BAMS 3rd Professional Phase">BAMS 3rd Professional Phase</option>
                        <option value="BUMS Professional Phase">BUMS Professional Phase</option>
                        <option value="PG Residency Year 1">PG Residency Year 1</option>
                        <option value="PG Residency Year 2">PG Residency Year 2</option>
                        <option value="PG Residency Year 3">PG Residency Year 3</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Duration (Years) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.durationYears ?? (isSelectedCourseSemesterSystem ? 0.5 : 1.5)}
                      onChange={(e) => setFormData({ ...formData, durationYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </>
              )}

              {/* BATCH FORM */}
              {activeTab === 'batches' && (() => {
                const batchCollegeCourses = getCoursesForCollege(formData.collegeId || colleges[0]?.id || '');
                return (
                  <>
                    {/* Course selector — critical for correct course_cd mapping */}
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5">
                        <span>🎓 Map to Course *</span>
                        <span className="text-[10px] text-indigo-500 font-normal">(Saves as course_cd in DB)</span>
                      </label>
                      <select
                        value={formData.courseId || ''}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                        className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                        required
                      >
                        <option value="">-- Select Course --</option>
                        {(batchCollegeCourses.length > 0 ? batchCollegeCourses : courses).map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">Batch Code *</label>
                        <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono" placeholder="MB2025" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">Admission Year *</label>
                        <input type="number" required value={formData.year || new Date().getFullYear()} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">Start Date</label>
                        <input type="date" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">End Date</label>
                        <input type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white" />
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* DEPARTMENT FORM */}
              {activeTab === 'branches' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Department Code *</label>
                      <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono" placeholder="PATH / ANESTH / ANAT" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Specialty Type</label>
                      <select value={formData.type || 'Clinical'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white">
                        <option value="Pre-Clinical">Pre-Clinical (Anatomy, Physiology, Biochemistry)</option>
                        <option value="Para-Clinical">Para-Clinical (Pathology, Pharmacology, Microbiology, Forensic)</option>
                        <option value="Clinical">Clinical (Anesthesiology, Medicine, Surgery, Pediatrics, OBG, Ortho)</option>
                        <option value="Non-Clinical">Non-Clinical</option>
                        <option value="Paramedical">Paramedical</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Department / Specialty Name *</label>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white" placeholder="Anesthesiology / Pathology / Human Anatomy" />
                  </div>
                </>
              )}

              {/* GROUP MASTER FORM — Cascading: Course → Batch → Branch → Code/Name/Capacity */}
              {activeTab === 'groups' && (() => {
                // Derive filtered lists from already-loaded state
                const groupCollegeCourses = getCoursesForCollege(formData.collegeId || colleges[0]?.id || '');
                // Batches link to courses via course_code (e.g. 'MBBS'), not a UUID
                const selectedCourseCd = courses.find(c => c.id === formData.courseId)?.code || '';
                const groupCourseBatches = batches.filter((b) =>
                  formData.courseId && selectedCourseCd
                    ? (b.course_code === selectedCourseCd || (b as any).course_cd === selectedCourseCd)
                    : true
                );
                return (
                  <>
                    {/* Step 1 — Select Course */}
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wide">Step 1 — Select Course *</label>
                      <select
                        value={formData.courseId || ''}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value, batchId: '' })}
                        className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="">-- Select Course --</option>
                        {groupCollegeCourses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2 — Select Batch (filtered by course) */}
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wide">Step 2 — Select Batch *</label>
                      <select
                        value={formData.batchId || ''}
                        onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                        className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="">-- Select Batch --</option>
                        {(formData.courseId ? groupCourseBatches : batches).map((b) => (
                          <option key={b.id} value={b.id}>Batch {b.code} — {b.year}</option>
                        ))}
                      </select>
                      {formData.courseId && groupCourseBatches.length === 0 && (
                        <p className="text-xs text-amber-500 mt-1">⚠️ No batches found for selected course. Showing all batches.</p>
                      )}
                    </div>

                    {/* Step 3 — Select Department (optional) */}
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wide">Step 3 — Select Department (Optional, e.g. Pathology, Anesthesia)</label>
                      <select
                        value={formData.departmentId || ''}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="">-- All Branches (No Filter) --</option>
                        {branches.map((br) => (
                          <option key={br.id} value={br.id}>{br.name} ({br.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 4 — Group Code + Capacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">Group Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.code || ''}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono text-lg font-bold"
                          placeholder="A"
                        />
                        <p className="text-xs text-slate-400">e.g. A, B, C, D or GRP-A</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300 font-semibold">Student Capacity</label>
                        <input
                          type="number"
                          value={formData.capacity || 50}
                          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white font-mono"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    {/* Step 5 — Group Name */}
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Group Title / Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-white"
                        placeholder="e.g. Group A (Batch 2024)"
                      />
                    </div>
                  </>
                );
              })()}

              {/* SESSION FORM */}
              {activeTab === 'sessions' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Session Title *</label>
                    <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Start Date</label>
                      <input type="date" required value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">End Date</label>
                      <input type="date" required value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="isCurrent" checked={Boolean(formData.isCurrent)} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="rounded bg-slate-50 dark:bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-300 dark:border-slate-800" />
                    <label htmlFor="isCurrent" className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Set as Current Active Session</label>
                  </div>
                </>
              )}

              {/* RESIDENCY / HOSTELLER / DAY SCHOLAR FORM */}
              {activeTab === 'residencies' && (
                <>
                  <div className="space-y-1 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                      <span>Residency Category Type *</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Select Student Occupancy Category</span>
                    </label>
                    <select
                      value={formData.residencyType || 'Hosteller'}
                      onChange={(e) => setFormData({ ...formData, residencyType: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Resident">🩺 Resident (PG Resident Doctor / Intern)</option>
                      <option value="Hosteller">🏠 Hosteller (Hostel Inmate / Boarder)</option>
                      <option value="Day Scholar">🚌 Day Scholar (Non-Hostel Commuter)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Category / Block Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.categoryName || ''}
                      onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                      placeholder="e.g. PG Doctor Residency Block A / UG MBBS Boys Hostel"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Block / Wing / Route Info</label>
                    <input
                      type="text"
                      value={formData.blockWing || ''}
                      onChange={(e) => setFormData({ ...formData, blockWing: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white"
                      placeholder="e.g. Block A - Single Room / City Bus Route 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Total Capacity</label>
                      <input
                        type="number"
                        value={formData.totalCapacity ?? 100}
                        onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Allocated Count</label>
                      <input
                        type="number"
                        value={formData.allocatedCount ?? 0}
                        onChange={(e) => setFormData({ ...formData, allocatedCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold">Monthly Fee (₹) / Allowance</label>
                    <input
                      type="number"
                      value={formData.monthlyFee ?? 10000}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-300 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded font-semibold text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-200 dark:bg-slate-800">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded font-bold text-slate-900 dark:text-white bg-indigo-600 hover:bg-indigo-500 shadow">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
