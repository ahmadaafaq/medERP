'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface College {
  id: string;
  code: string;
  name: string;
  slug: string;
}

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  gender?: string;
  experience?: string;
  staff_type: string;
  is_active: boolean;
  photo_url?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

const STANDARD_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Resident',
  'Junior Resident',
  'Tutor / Demonstrator',
  'Medical Officer',
  'Head of Department (HOD)',
  'Dean / Principal',
  'Medical Superintendent',
  'Registrar / Executive Officer',
  'Senior Clerk',
  'Administrative Officer',
  'Assistant Registrar',
  'Other / Custom',
];

export default function StaffMasterPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filtering and pagination
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStaffTypeFilter, setSelectedStaffTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Faculty | null>(null);

  // Custom Designation control
  const [selectedDesignationOption, setSelectedDesignationOption] = useState('Assistant Professor');
  const [customDesignationText, setCustomDesignationText] = useState('');

  // Upload photo states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    college_id: '',
    college_slug: '',
    empId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Assistant Professor',
    departmentId: '',
    subjectId: '',
    gender: 'Male',
    experience: '',
    staffType: 'Faculty',
    photoUrl: '',
    isActive: true,
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');

  // 1. Initial Metadata Fetch (Colleges, Depts, Subjects scoped by tenant)
  const fetchMetadata = async () => {
    setMetadataLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      let role = 'ADMIN';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      if (typeof window !== 'undefined') {
        role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
        userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        userSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
        setUserRole(role);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
        if (role !== 'SUPER_ADMIN') {
          setSelectedCollegeFilter(userColg);
        }
      }

      const activeTenantSlug = role === 'SUPER_ADMIN' ? 'all' : userSlug;

      const [colRes, deptRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
      ]);

      let loadedColleges: College[] = [];
      let loadedDepts: Department[] = [];
      let loadedSubs: Subject[] = [];

      if (colRes && colRes.ok) {
        const colJson = await colRes.json();
        const colList = colJson.data || colJson;
        if (Array.isArray(colList)) {
          if (role !== 'SUPER_ADMIN') {
            const myCol = colList.find((c: any) => String(c.colg_cd) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug);
            loadedColleges = myCol ? [myCol] : [{ id: userColg, code: userColg, name: 'SRMS CET, Bareilly', slug: userSlug }];
          } else {
            loadedColleges = colList;
          }
          setColleges(loadedColleges);
        }
      }

      if (deptRes && deptRes.ok) {
        const deptJson = await deptRes.json();
        const deptList = deptJson.data || deptJson;
        if (Array.isArray(deptList)) {
          loadedDepts = deptList;
          setDepartments(deptList);
        }
      }

      if (subRes && subRes.ok) {
        const subJson = await subRes.json();
        const subList = subJson.data || subJson;
        if (Array.isArray(subList)) {
          loadedSubs = subList;
          setSubjects(subList);
        }
      }

      // Initialize default form college if empty
      if (loadedColleges.length > 0) {
        const firstCol = loadedColleges[0];
        const firstColCd = firstCol.code || firstCol.id || '1';
        const matchingDepts = loadedDepts.filter(d =>
          d.college_id === firstCol.id ||
          d.college_slug === firstCol.slug ||
          String(d.colg_cd) === String(firstColCd) ||
          String(d.college_code) === String(firstColCd)
        );
        const firstDept = matchingDepts[0];

        setFormData(prev => ({
          ...prev,
          college_id: prev.college_id || firstColCd,
          college_slug: prev.college_slug || firstCol.slug || '',
          departmentId: prev.departmentId || firstDept?.id || firstDept?.code || '',
        }));
      }
    } catch (err) {
      console.error('[StaffMaster] Metadata fetch error:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // 2. Fetch Faculties based on college filter
  const fetchFaculties = async (colFilter: string = selectedCollegeFilter) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'ADMIN').toUpperCase() : 'ADMIN';
      const userSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

      let querySlug = userSlug;
      if (role === 'SUPER_ADMIN') {
        const targetCollege = colleges.find(c => String(c.code) === String(colFilter) || String(c.id) === String(colFilter) || c.slug === colFilter);
        querySlug = colFilter === 'all' ? 'all' : (targetCollege?.slug || colFilter || 'srms-cet-bareilly');
      }

      const res = await fetch(`${API_BASE}/users/faculty?tenant=${querySlug}&limit=500`, { headers });
      if (res.ok) {
        const json = await res.json();
        let dataList: Faculty[] = [];
        if (Array.isArray(json)) {
          dataList = json;
        } else if (Array.isArray(json?.data?.data)) {
          dataList = json.data.data;
        } else if (Array.isArray(json?.data)) {
          dataList = json.data;
        } else if (Array.isArray(json?.items)) {
          dataList = json.items;
        }
        const seen = new Set<string>();
        const dedupedList = dataList.filter(f => {
          const key = f.emp_id || f.id || f.email;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFaculties(dedupedList);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('[StaffMaster] Failed to fetch staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchFaculties(selectedCollegeFilter);
  }, [selectedCollegeFilter, colleges.length]);

  // Convert uploaded photo file to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('error', 'File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, photoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photoUrl: '' }));
  };

  // Filter available departments for the Top Filter Bar
  const availableFilterDepartments = useMemo(() => {
    if (selectedCollegeFilter === 'all') return departments;
    const currentSelectedCol = colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter);
    return departments.filter(d => {
      if (!currentSelectedCol) return true;
      return (
        d.college_id === currentSelectedCol.id ||
        d.college_slug === currentSelectedCol.slug ||
        String(d.colg_cd) === String(currentSelectedCol.code) ||
        String(d.colg_cd) === String(currentSelectedCol.id) ||
        String(d.college_code) === String(currentSelectedCol.code)
      );
    });
  }, [departments, selectedCollegeFilter, colleges]);

  // Filter available departments inside Modal Form based on chosen College
  const modalAvailableDepartments = useMemo(() => {
    if (!formData.college_id && !formData.college_slug) return departments;
    const currentFormCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug);
    const colCode = currentFormCol?.code || formData.college_id;
    const colSlug = currentFormCol?.slug || formData.college_slug;
    const colId = currentFormCol?.id || formData.college_id;

    return departments.filter(d => {
      const isColMatch =
        (colCode && (String(d.colg_cd) === String(colCode) || String(d.college_code) === String(colCode))) ||
        (colSlug && d.college_slug === colSlug) ||
        (colId && (d.college_id === colId || String(d.colg_cd) === String(colId)));
      return isColMatch;
    });
  }, [departments, formData.college_id, formData.college_slug, colleges]);

  // Filter available subjects inside Modal Form based on chosen College and chosen Department
  const modalAvailableSubjects = useMemo(() => {
    const currentFormCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug);
    const colCode = currentFormCol?.code || formData.college_id;
    const colSlug = currentFormCol?.slug || formData.college_slug;
    const colId = currentFormCol?.id || formData.college_id;

    const chosenDept = departments.find(d =>
      d.id === formData.departmentId ||
      d.code === formData.departmentId ||
      d.branch_cd === formData.departmentId
    );

    return subjects.filter(s => {
      // 1. College Match
      if (currentFormCol || colCode || colSlug || colId) {
        const isColMatch =
          !s.college_id ||
          (colCode && (String(s.colg_cd) === String(colCode) || String(s.college_code) === String(colCode))) ||
          (colSlug && s.college_slug === colSlug) ||
          (colId && s.college_id === colId);
        if (!isColMatch) return false;
      }
      // 2. Department Match
      if (formData.departmentId) {
        const isDeptMatch =
          s.department_id === formData.departmentId ||
          s.department_code === formData.departmentId ||
          s.branch_cd === formData.departmentId ||
          (chosenDept && (
            s.department_id === chosenDept.id ||
            s.department_code === chosenDept.code ||
            s.branch_cd === chosenDept.branch_cd ||
            s.branch_cd === chosenDept.code ||
            (s.department_name && chosenDept.name && s.department_name.toLowerCase() === chosenDept.name.toLowerCase())
          ));
        if (!isDeptMatch) return false;
      }
      return true;
    });
  }, [subjects, departments, formData.college_id, formData.college_slug, formData.departmentId, colleges]);

  // Handle College change in Modal Form
  const handleCollegeChangeInForm = (colCodeOrId: string) => {
    const selectedCol = colleges.find(c => String(c.code) === String(colCodeOrId) || String(c.id) === String(colCodeOrId) || c.slug === colCodeOrId) || colleges[0];
    const targetColCd = selectedCol?.code || selectedCol?.id || '1';
    const targetColSlug = selectedCol?.slug || '';

    // Find available depts for this new college
    const matchingDepts = departments.filter(d =>
      d.college_id === selectedCol?.id ||
      d.college_slug === selectedCol?.slug ||
      String(d.colg_cd) === String(targetColCd) ||
      String(d.college_code) === String(targetColCd)
    );
    const firstDept = matchingDepts[0];

    // Find subjects for first dept
    const matchingSubs = subjects.filter(s =>
      (!selectedCol || s.college_id === selectedCol.id || s.college_slug === selectedCol.slug || String(s.colg_cd) === String(targetColCd) || String(s.college_code) === String(targetColCd)) &&
      (!firstDept || s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
    );

    setFormData(prev => ({
      ...prev,
      college_id: targetColCd,
      college_slug: targetColSlug,
      departmentId: firstDept?.id || firstDept?.code || firstDept?.branch_cd || '',
      subjectId: matchingSubs[0]?.id || matchingSubs[0]?.code || '',
    }));
  };

  // Handle Department change in Modal Form
  const handleDepartmentChangeInForm = (deptId: string) => {
    const chosenDept = departments.find(d => d.id === deptId || d.code === deptId || d.branch_cd === deptId);
    const matchingSubs = subjects.filter(s =>
      !deptId ||
      s.department_id === deptId ||
      s.department_code === deptId ||
      s.branch_cd === deptId ||
      (chosenDept && (s.department_id === chosenDept.id || s.department_code === chosenDept.code || s.branch_cd === chosenDept.branch_cd))
    );
    const isCurrentSubValid = matchingSubs.some(s => s.id === formData.subjectId || s.code === formData.subjectId);

    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      subjectId: isCurrentSubValid ? prev.subjectId : (matchingSubs[0]?.id || ''),
    }));
  };

  const handleDesignationSelect = (option: string) => {
    setSelectedDesignationOption(option);
    if (option === 'Other / Custom') {
      setFormData(prev => ({ ...prev, designation: customDesignationText }));
    } else {
      setFormData(prev => ({ ...prev, designation: option }));
    }
  };

  const handleCustomDesignationChange = (text: string) => {
    setCustomDesignationText(text);
    setFormData(prev => ({ ...prev, designation: text }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setPhotoPreview(null);
    setSelectedDesignationOption('Assistant Professor');
    setCustomDesignationText('');

    const targetCol = (selectedCollegeFilter !== 'all' ? colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter) : null) || colleges[0];
    const targetColCd = targetCol?.code || targetCol?.id || '1';
    const targetColSlug = targetCol?.slug || '';

    const matchingDepts = departments.filter(d =>
      !targetCol ||
      d.college_id === targetCol.id ||
      d.college_slug === targetCol.slug ||
      String(d.colg_cd) === String(targetColCd) ||
      String(d.college_code) === String(targetColCd)
    );
    const firstDept = matchingDepts[0];

    const matchingSubs = subjects.filter(s =>
      (!targetCol || s.college_id === targetCol.id || s.college_slug === targetCol.slug || String(s.colg_cd) === String(targetColCd) || String(s.college_code) === String(targetColCd)) &&
      (!firstDept || s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
    );

    setFormData({
      college_id: targetColCd,
      college_slug: targetColSlug,
      empId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      password: '',
      phone: '',
      designation: 'Assistant Professor',
      departmentId: firstDept?.id || firstDept?.code || firstDept?.branch_cd || '',
      subjectId: matchingSubs[0]?.id || matchingSubs[0]?.code || '',
      gender: 'Male',
      experience: '2 Years',
      staffType: 'Faculty',
      photoUrl: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };


  const handleOpenEditModal = (item: Faculty) => {
    setEditingItem(item);
    setPhotoPreview(item.photo_url || null);

    const isStd = STANDARD_DESIGNATIONS.includes(item.designation);
    if (isStd) {
      setSelectedDesignationOption(item.designation);
      setCustomDesignationText('');
    } else if (item.designation) {
      setSelectedDesignationOption('Other / Custom');
      setCustomDesignationText(item.designation);
    } else {
      setSelectedDesignationOption('Assistant Professor');
      setCustomDesignationText('');
    }

    const matchedCol = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];

    setFormData({
      college_id: matchedCol?.code || matchedCol?.id || item.college_id || '1',
      college_slug: matchedCol?.slug || item.college_slug || '',
      empId: item.emp_id,
      name: item.name,
      email: item.email || '',
      password: '',
      phone: item.phone || '',
      designation: item.designation || 'Assistant Professor',
      departmentId: item.department_id || item.department_code || '',
      subjectId: item.subject_id || item.subject_code || '',
      gender: item.gender || 'Male',
      experience: item.experience || '',
      staffType: item.staff_type || 'Faculty',
      photoUrl: item.photo_url || '',
      isActive: item.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This will remove their user account.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const targetCol = colleges.find(c => c.slug === itemCollegeSlug || String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter));
      const slug = itemCollegeSlug || targetCol?.slug || (selectedCollegeFilter !== 'all' ? selectedCollegeFilter : 'srms-cet-bareilly');

      const res = await fetch(`${API_BASE}/users/faculty/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        showAlert('success', 'Staff member deleted successfully from PostgreSQL!');
        fetchFaculties(selectedCollegeFilter);
      } else {
        const json = await res.json();
        showAlert('error', json.message || 'Failed to delete staff member');
      }
    } catch (err) {
      showAlert('error', 'Network error while deleting staff member');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleMapping: Record<string, string> = {
      'Faculty': 'FACULTY',
      'HOD': 'HOD',
      'ADMIN': 'COLLEGE_ADMIN',
      'Admin': 'COLLEGE_ADMIN',
      'CLERK': 'CLERK',
      'Clerk': 'CLERK',
      'EXECUTIVE': 'FACULTY',
      'TUTOR': 'FACULTY',
      'PG': 'FACULTY',
    };

    const isEdit = !!editingItem;
    if (!isEdit && (!formData.password || formData.password.length < 8)) {
      showAlert('error', 'Account password must be at least 8 characters long.');
      return;
    }

    const targetCol = colleges.find(c => String(c.code) === String(formData.college_id) || String(c.id) === String(formData.college_id) || c.slug === formData.college_slug) || colleges[0];
    const slug = targetCol?.slug || formData.college_slug || 'srms-cet-bareilly';

    const url = isEdit
      ? `${API_BASE}/users/faculty/${editingItem.id}?tenant=${slug}`
      : `${API_BASE}/users/faculty?tenant=${slug}`;
    const method = isEdit ? 'PUT' : 'POST';

    const finalDesignation = selectedDesignationOption === 'Other / Custom'
      ? customDesignationText
      : selectedDesignationOption;

    const body: Record<string, any> = {
      ...formData,
      college_id: targetCol?.code || targetCol?.id || formData.college_id,
      college_slug: slug,
      departmentId: formData.departmentId || undefined,
      subjectId: formData.subjectId || undefined,
      designation: finalDesignation,
      role: roleMapping[formData.staffType] || 'FACULTY',
    };

    if (isEdit) {
      delete body.password;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showAlert('success', `Staff member profile ${isEdit ? 'updated' : 'registered'} in PostgreSQL successfully!`);
        setIsModalOpen(false);
        fetchFaculties(selectedCollegeFilter);
      } else {
        const json = await res.json();
        const displayError = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        showAlert('error', displayError || `Failed to ${isEdit ? 'update' : 'create'} staff profile.`);
      }
    } catch (err) {
      showAlert('error', 'Network error during save operation.');
    }
  };

  // Filter faculties locally
  const filteredFaculties = useMemo(() => {
    const rawList = faculties.filter((fac: Faculty) => {
      // 1. Filter by College
      if (selectedCollegeFilter !== 'all') {
        const targetCol = colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter);
        const targetColCode = targetCol?.code || selectedCollegeFilter;
        const targetColSlug = targetCol?.slug || selectedCollegeFilter;
        const targetColId = targetCol?.id || selectedCollegeFilter;

        const facColMatch =
          String(fac.college_code) === String(targetColCode) ||
          fac.college_slug === targetColSlug ||
          fac.college_id === targetColId ||
          (targetCol && (fac.college_id === targetCol.id || fac.college_slug === targetCol.slug || String(fac.college_code) === String(targetCol.code)));
        if (!facColMatch && (fac.college_code || fac.college_slug || fac.college_id)) return false;
      }

      // 2. Filter by Department
      if (selectedDeptFilter !== 'all') {
        const chosenDept = departments.find(d => d.id === selectedDeptFilter || d.code === selectedDeptFilter || d.branch_cd === selectedDeptFilter);
        const deptMatch =
          fac.department_id === selectedDeptFilter ||
          fac.department_code === selectedDeptFilter ||
          (chosenDept && (
            fac.department_id === chosenDept.id ||
            fac.department_code === chosenDept.code ||
            (fac.department_name && chosenDept.name && fac.department_name.toLowerCase() === chosenDept.name.toLowerCase())
          ));
        if (!deptMatch) return false;
      }

      // 3. Filter by Staff Type
      if (selectedStaffTypeFilter !== 'all') {
        if (fac.staff_type?.toLowerCase() !== selectedStaffTypeFilter.toLowerCase()) return false;
      }

      // 4. Search Keyword
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          fac.name?.toLowerCase().includes(term) ||
          fac.emp_id?.toLowerCase().includes(term) ||
          fac.email?.toLowerCase().includes(term) ||
          fac.phone?.toLowerCase().includes(term) ||
          (fac.department_name && fac.department_name.toLowerCase().includes(term)) ||
          (fac.subject_name && fac.subject_name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      return true;
    });

    const seen = new Set<string>();
    return rawList.filter((f: Faculty) => {
      const key = f.emp_id || f.id || f.email;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [faculties, selectedCollegeFilter, selectedDeptFilter, selectedStaffTypeFilter, searchTerm, colleges, departments]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFaculties.length / ITEMS_PER_PAGE));
  const paginatedFaculties = filteredFaculties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Staff Master Administration" />
        <main className="p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0F172A]">

          {/* Flash Alert */}
          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-md flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Top Filter Bar adhering to Theme.md */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

              {/* 1. College Selector */}
              <div className="relative flex items-center gap-1.5">
                <select
                  value={selectedCollegeFilter}
                  disabled={userRole !== 'SUPER_ADMIN'}
                  onChange={(e) => { setSelectedCollegeFilter(e.target.value); setSelectedDeptFilter('all'); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm disabled:cursor-not-allowed"
                >
                  {userRole === 'SUPER_ADMIN' && <option value="all">🏛️ All Colleges ({colleges.length})</option>}
                  {colleges.map((col) => (
                    <option key={col.id} value={col.code || col.id}>
                      🏛️ [#{col.code || col.id}] {col.name}
                    </option>
                  ))}
                </select>
                {userRole !== 'SUPER_ADMIN' && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* 2. Department Selector (College Filtered) */}
              <div className="relative">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm"
                >
                  <option value="all">🏢 All Departments ({availableFilterDepartments.length})</option>
                  {availableFilterDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id || dept.code}>
                      🏢 {dept.name} ({dept.code || dept.branch_cd || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Staff Type Selector */}
              <div className="relative">
                <select
                  value={selectedStaffTypeFilter}
                  onChange={(e) => { setSelectedStaffTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm"
                >
                  <option value="all">👤 All Staff Types</option>
                  {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 4. Search Box */}
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search staff code, name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 w-full text-slate-900 dark:text-white placeholder:text-slate-400 pl-9 shadow-sm"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>

            {/* Add New Staff Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-[#5B4BFF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full lg:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              + Register New Staff
            </button>
          </div>

          {/* Staff Roster Table Card */}
          <div className="bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50 dark:bg-slate-800/50">
                    <th className="pl-6 py-4">Staff Member</th>
                    <th className="py-4">Staff Code</th>
                    <th className="py-4">College</th>
                    <th className="py-4">Role & Type</th>
                    <th className="py-4">Department & Subject</th>
                    <th className="py-4">Contact & Exp</th>
                    <th className="py-4">Status</th>
                    <th className="pr-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                  {loading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-slate-50/50 dark:bg-slate-900/20">
                        <td className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                            <div className="space-y-2">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                              <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded w-16"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-14"></div></td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div></td>
                        <td className="pr-6 py-4 text-right"><div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedFaculties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-slate-400 font-medium">
                        No staff records found matching the active filters. Click &quot;+ Register New Staff&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    paginatedFaculties.map((fac: Faculty) => {
                      const matchedCol = colleges.find(c => c.id === fac.college_id || c.code === fac.college_code || c.slug === fac.college_slug);
                      const displayColName = matchedCol?.name || fac.college_name || 'SRMS CET';
                      const displayColCode = matchedCol?.code || fac.college_code || '1';

                      return (
                        <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                          <td className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-0.5">
                                {fac.photo_url ? (
                                  <img
                                    src={fac.photo_url}
                                    alt={fac.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="font-extrabold text-[#5B4BFF] text-xs">
                                    {fac.name ? fac.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">{fac.name}</p>
                                <p className="text-[11px] text-[#5B4BFF] font-semibold">{fac.designation || 'Staff Member'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                              {fac.emp_id}
                            </span>
                          </td>

                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-[#F36C21] border border-orange-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                              🏛️ #{displayColCode} {displayColName}
                            </span>
                          </td>

                          <td className="py-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20 font-bold uppercase text-[9px] tracking-wider inline-block">
                                {fac.staff_type}
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{fac.email}</p>
                            </div>
                          </td>

                          <td className="py-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px] inline-block">
                                🏢 {fac.department_name || 'General Dept'}
                              </span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {fac.subject_name ? `📚 ${fac.subject_name}` : 'No Specialty Subject'}
                              </p>
                            </div>
                          </td>

                          <td className="py-4">
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{fac.phone || 'No Mobile'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{fac.experience ? `${fac.experience} Exp.` : 'Exp: N/A'}</p>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[9px] tracking-wide inline-block ${
                              fac.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {fac.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="pr-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(fac)}
                                className="p-2 rounded-xl bg-[#5B4BFF]/10 hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white transition-all border border-[#5B4BFF]/30 shadow-sm"
                                title="Edit Staff Member"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(fac.id, fac.college_slug)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-500/30 shadow-sm"
                                title="Delete Staff Member"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#E7EAF3] dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFaculties.length)} of {filteredFaculties.length} staff records
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* DUAL-MODE MODAL WITH COLLEGE-BASED DEPARTMENTS AND SUBJECTS SELECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden shadow-2xl rounded-3xl bg-white dark:bg-[#1B1E28] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">

            {/* Header Ribbon adhering to Theme.md (#2D2575) */}
            <div className="bg-[#2D2575] text-white px-6 py-4.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg border border-white/20">
                  🏛️
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-wide uppercase">
                    {editingItem ? 'Update Faculty Profile' : 'Register New Staff Member'}
                  </h2>
                  <p className="text-[11px] text-white/80 font-medium">
                    Provide college affiliation, department links, specialty subjects, and administrative credentials.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-rose-500/80 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split Form Layout */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">

              {/* Left Column: Live Profile Card & Photo Upload */}
              <div className="w-full md:w-80 border-r border-[#E7EAF3] dark:border-slate-800 p-6 flex flex-col justify-between bg-slate-50/70 dark:bg-slate-900/40 space-y-6">

                {/* Live Card Preview */}
                <div className="w-full space-y-3">
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">Live Profile Card</span>

                  <div className="w-full rounded-[22px] bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center space-y-3 relative overflow-hidden shadow-sm">

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        formData.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Image Avatar */}
                    <div className="w-22 h-22 rounded-full p-1 bg-gradient-to-tr from-[#5B4BFF] via-[#7867FF] to-[#F36C21] shadow-md relative group mt-2">
                      <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center relative">
                        {photoPreview ? (
                          <>
                            <img src={photoPreview} alt="Staff Preview" className="w-full h-full object-cover rounded-full" />
                            <button
                              type="button"
                              onClick={clearPhoto}
                              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-extrabold uppercase tracking-wider transition-opacity"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                            <svg className="w-8 h-8 text-[#5B4BFF] mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">No Photo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-0.5">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                        {formData.name || 'Full Name'}
                      </h4>
                      <p className="text-[11px] text-[#5B4BFF] font-bold uppercase tracking-wider">
                        {formData.designation || 'Designation'}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-widest mt-1 bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block">
                        {formData.empId || 'EMPCODE'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 w-full flex flex-col items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20 font-extrabold uppercase text-[9px] tracking-wider">
                        {formData.staffType} ({formData.gender})
                      </span>
                      {formData.college_id && (
                        <span className="text-[10px] text-[#F36C21] font-bold truncate max-w-[220px]">
                          🏛️ {colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug)?.name || 'College Selected'}
                        </span>
                      )}
                      {formData.departmentId && (
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold truncate max-w-[220px]">
                          🏢 {departments.find(d => d.id === formData.departmentId || d.code === formData.departmentId)?.name || 'Department Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Photo Widget */}
                <div className="w-full space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">Upload Profile Photo</span>
                  <label className="flex flex-col items-center justify-center w-full h-22 border-2 border-dashed border-[#5B4BFF]/30 hover:border-[#5B4BFF] rounded-2xl cursor-pointer bg-white dark:bg-slate-900/40 hover:bg-[#5B4BFF]/5 transition-all p-3 text-center group">
                    <svg className="w-6 h-6 text-[#5B4BFF] mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                    <span className="text-[11px] text-slate-700 dark:text-slate-200 font-bold">Choose Image File</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">PNG, JPG up to 2MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Form Inputs */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white dark:bg-[#1B1E28]">

                {/* 1. College & Professional Hierarchy (The core request) */}
                <div className="space-y-3 p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1.5">
                    <span>🏛️</span> Step 1: College Affiliation & Academic Links *
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {/* Choose College */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        1. College *
                      </label>
                      <select
                        required
                        value={formData.college_id}
                        onChange={(e) => handleCollegeChangeInForm(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                      >
                        {colleges.map((c) => (
                          <option key={c.id} value={c.code || c.id}>
                            🏛️ [#{c.code || c.id}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Department (Filtered by College) */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        2. Department * ({modalAvailableDepartments.length})
                      </label>
                      <select
                        required
                        value={formData.departmentId}
                        onChange={(e) => handleDepartmentChangeInForm(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                      >
                        <option value="">-- Choose Department --</option>
                        {modalAvailableDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id || dept.code}>
                            🏢 {dept.name} ({dept.code || dept.branch_cd || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Specialty Subject (Filtered by College & Department) */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        3. Specialty Subject ({modalAvailableSubjects.length})
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                      >
                        <option value="">No specialty subject</option>
                        {modalAvailableSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id || sub.code}>
                            📚 {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* 2. Account Credentials */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>🔑</span> Step 2: Account Credentials & Identity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Staff Code */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Staff Code *</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingItem}
                        value={formData.empId}
                        onChange={(e) => setFormData({ ...formData, empId: e.target.value.toUpperCase() })}
                        placeholder="e.g. EMP1004"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    {/* Faculty Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Faculty Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Sarah Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingItem}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. sarah.sharma@srms.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        {editingItem ? 'Password (Locked)' : 'Account Password *'}
                      </label>
                      <input
                        type="password"
                        required={!editingItem}
                        disabled={!!editingItem}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingItem ? '••••••••' : 'Min 8 chars, strong password'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Role & Designation */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>🩺</span> Step 3: Designation & Role Assignments
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Staff Type */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Staff Type *</label>
                      <select
                        value={formData.staffType}
                        onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                      >
                        {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG'].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Designation */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Designation *</label>
                      <select
                        value={selectedDesignationOption}
                        onChange={(e) => handleDesignationSelect(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                      >
                        {STANDARD_DESIGNATIONS.map((desig) => (
                          <option key={desig} value={desig}>{desig}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Designation text field */}
                    {selectedDesignationOption === 'Other / Custom' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">Custom Designation Title *</label>
                        <input
                          type="text"
                          required
                          value={customDesignationText}
                          onChange={(e) => handleCustomDesignationChange(e.target.value)}
                          placeholder="e.g. Senior Medical Scientist / Dean Academics"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#5B4BFF]/50 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Personal & Demographics */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span>👤</span> Step 4: Personal & Demographics
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Experience</label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 5 Years"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Mobile Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Access Toggle & Form Action Buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-[#E7EAF3] dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="isActiveToggle" className="text-xs font-extrabold uppercase text-slate-800 dark:text-white tracking-wider cursor-pointer select-none">
                      Grant System Access (Is Active)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs shadow-lg shadow-[#5B4BFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                      <span>💾</span>
                      <span>{editingItem ? 'Save Updates' : 'Register Profile'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
