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
  designation?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  photo_url?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  staff_type?: string;
  is_active?: boolean;
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

interface FacultySubjectLink {
  id: string;
  faculty_id: string;
  subject_id: string;
  faculty_name: string;
  faculty_code: string;
  faculty_designation?: string;
  faculty_department_name?: string;
  faculty_department_code?: string;
  subject_name: string;
  subject_code: string;
  subject_department_name?: string;
  subject_department_code?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  created_at: string;
  isPrimaryRegistered?: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function SubjectLinkerPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [links, setLinks] = useState<FacultySubjectLink[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Step-by-Step Form states (College -> Department -> Subject -> Faculty Auto-Complete)
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [facultySearchTerm, setFacultySearchTerm] = useState('');

  // Edit mode state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Table Filters & Loading
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  // 1. Initial Metadata Fetch (Colleges, All Depts, All Subjects, All Links)
  const fetchMetadata = async () => {
    setMetadataLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [colRes, deptRes, subRes, linkRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=all`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=all`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/faculty-subjects?tenant=all`, { headers }).catch(() => null),
      ]);

      let loadedColleges: College[] = [];
      let loadedDepts: Department[] = [];
      let loadedSubs: Subject[] = [];

      if (colRes && colRes.ok) {
        const colJson = await colRes.json();
        const colList = colJson.data || colJson;
        if (Array.isArray(colList)) {
          loadedColleges = colList;
          setColleges(colList);
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

      if (linkRes && linkRes.ok) {
        const linkJson = await linkRes.json();
        const linkList = linkJson.data || linkJson;
        if (Array.isArray(linkList)) {
          setLinks(linkList);
        }
      }

      // Initialize default college selection
      if (loadedColleges.length > 0) {
        const savedSlug = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant')) : null;
        const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;

        const defaultCol = loadedColleges.find(c =>
          (savedSlug && (c.slug === savedSlug || c.id === savedSlug)) ||
          (savedColgCd && (String((c as any).colg_cd) === savedColgCd || String(c.id) === savedColgCd || String(c.code) === savedColgCd)) ||
          c.slug === 'srms-cet-bareilly' ||
          String(c.code) === '1'
        ) || loadedColleges[0];

        const defaultColCode = defaultCol.code || defaultCol.id || '1';
        const defaultColSlug = defaultCol.slug || 'srms-cet-bareilly';

        setSelectedCollegeId(defaultColCode);
        setSelectedCollegeSlug(defaultColSlug);
        setSelectedCollegeFilter(defaultColCode);
        fetchFaculties(defaultColSlug);

        const matchingDepts = loadedDepts.filter(d =>
          d.college_id === defaultCol.id ||
          d.college_slug === defaultCol.slug ||
          String(d.colg_cd) === String(defaultColCode) ||
          String(d.college_code) === String(defaultColCode)
        );
        if (matchingDepts.length > 0) {
          const firstDept = matchingDepts[0];
          setSelectedDeptId(firstDept.id || firstDept.code);

          const matchingSubs = loadedSubs.filter(s =>
            (s.college_id === defaultCol.id || s.college_slug === defaultCol.slug || String(s.colg_cd) === String(defaultColCode) || String(s.college_code) === String(defaultColCode)) &&
            (s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
          );
          if (matchingSubs.length > 0) {
            setSelectedSubjectId(matchingSubs[0].id || matchingSubs[0].code);
          }
        }
      }
    } catch (err) {
      console.error('[SubjectLinker] Metadata fetch error:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // 2. Fetch Faculties based on college selection
  const fetchFaculties = async (colSlugOrFilter: string = 'all') => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const targetCol = colleges.find(c => String(c.code) === String(colSlugOrFilter) || String(c.id) === String(colSlugOrFilter) || c.slug === colSlugOrFilter);
      const querySlug = colSlugOrFilter === 'all' ? 'all' : (targetCol?.slug || colSlugOrFilter || 'srms-cet-bareilly');

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
        setFaculties(dataList);
      }
    } catch (err) {
      console.error('[SubjectLinker] Failed to fetch staff roster', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Explicit Links
  const fetchLinks = async (colSlugOrFilter: string = selectedCollegeFilter) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const targetCol = colleges.find(c => String(c.code) === String(colSlugOrFilter) || String(c.id) === String(colSlugOrFilter) || c.slug === colSlugOrFilter);
      const querySlug = colSlugOrFilter === 'all' ? 'all' : (targetCol?.slug || colSlugOrFilter);

      const res = await fetch(`${API_BASE}/admin-master/faculty-subjects?tenant=${querySlug}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setLinks(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.error('[SubjectLinker] Failed to fetch explicit links', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchFaculties(selectedCollegeFilter);
    fetchLinks(selectedCollegeFilter);
  }, [selectedCollegeFilter, colleges.length]);

  // ─── Cascading Filters for Form ──────────────────────────────────────────
  // Departments available in form for selected college
  const formAvailableDepartments = useMemo(() => {
    if (!selectedCollegeId && !selectedCollegeSlug) return departments;
    const currentCol = colleges.find(c =>
      String(c.code) === String(selectedCollegeId) ||
      String(c.id) === String(selectedCollegeId) ||
      c.slug === selectedCollegeSlug
    );
    const colCode = currentCol?.code || selectedCollegeId;
    const colSlug = currentCol?.slug || selectedCollegeSlug;
    const colId = currentCol?.id || selectedCollegeId;

    return departments.filter(d => {
      return (
        (colCode && (String(d.colg_cd) === String(colCode) || String(d.college_code) === String(colCode))) ||
        (colSlug && d.college_slug === colSlug) ||
        (colId && (d.college_id === colId || String(d.colg_cd) === String(colId)))
      );
    });
  }, [departments, selectedCollegeId, selectedCollegeSlug, colleges]);

  // Subjects available in form for selected college & selected department
  const formAvailableSubjects = useMemo(() => {
    const currentCol = colleges.find(c =>
      String(c.code) === String(selectedCollegeId) ||
      String(c.id) === String(selectedCollegeId) ||
      c.slug === selectedCollegeSlug
    );
    const colCode = currentCol?.code || selectedCollegeId;
    const colSlug = currentCol?.slug || selectedCollegeSlug;
    const colId = currentCol?.id || selectedCollegeId;

    const chosenDept = departments.find(d =>
      d.id === selectedDeptId ||
      d.code === selectedDeptId ||
      d.branch_cd === selectedDeptId
    );

    return subjects.filter(s => {
      // 1. College Match
      if (currentCol || colCode || colSlug || colId) {
        const isColMatch =
          !s.college_id ||
          (colCode && (String(s.colg_cd) === String(colCode) || String(s.college_code) === String(colCode))) ||
          (colSlug && s.college_slug === colSlug) ||
          (colId && s.college_id === colId);
        if (!isColMatch) return false;
      }
      // 2. Department Match
      if (selectedDeptId) {
        const isDeptMatch =
          s.department_id === selectedDeptId ||
          s.department_code === selectedDeptId ||
          s.branch_cd === selectedDeptId ||
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
  }, [subjects, departments, selectedCollegeId, selectedCollegeSlug, selectedDeptId, colleges]);

  // Faculties available in form for selected college & selected department
  const formAvailableFaculties = useMemo(() => {
    const currentCol = colleges.find(c =>
      String(c.code) === String(selectedCollegeId) ||
      String(c.id) === String(selectedCollegeId) ||
      c.slug === selectedCollegeSlug
    );
    const colCode = currentCol?.code || selectedCollegeId;
    const colSlug = currentCol?.slug || selectedCollegeSlug;
    const colId = currentCol?.id || selectedCollegeId;

    const chosenDept = departments.find(d =>
      d.id === selectedDeptId ||
      d.code === selectedDeptId ||
      d.branch_cd === selectedDeptId
    );

    return faculties.filter(f => {
      // 1. College Match
      if (currentCol || colCode || colSlug || colId) {
        const isColMatch =
          !f.college_id ||
          (colCode && (String(f.college_code) === String(colCode))) ||
          (colSlug && f.college_slug === colSlug) ||
          (colId && f.college_id === colId);
        if (!isColMatch) return false;
      }

      // 2. Search Keyword Filter inside form
      if (facultySearchTerm) {
        const term = facultySearchTerm.toLowerCase();
        const matchesTerm =
          f.name.toLowerCase().includes(term) ||
          f.emp_id.toLowerCase().includes(term) ||
          (f.department_name && f.department_name.toLowerCase().includes(term));
        if (!matchesTerm) return false;
      }

      return true;
    });
  }, [faculties, departments, selectedCollegeId, selectedCollegeSlug, selectedDeptId, facultySearchTerm, colleges]);

  // ─── STEP HANDLERS ────────────────────────────────────────────────────────
  // Step 1: Change College
  const handleCollegeChange = (colCodeOrId: string) => {
    const targetCol = colleges.find(c => String(c.code) === String(colCodeOrId) || String(c.id) === String(colCodeOrId) || c.slug === colCodeOrId) || colleges[0];
    const targetCode = targetCol?.code || targetCol?.id || '1';
    const targetSlug = targetCol?.slug || 'srms-cet-bareilly';

    setSelectedCollegeId(targetCode);
    setSelectedCollegeSlug(targetSlug);

    // Auto-select first matching department
    const matchingDepts = departments.filter(d =>
      d.college_id === targetCol?.id ||
      d.college_slug === targetSlug ||
      String(d.colg_cd) === String(targetCode) ||
      String(d.college_code) === String(targetCode)
    );
    const firstDept = matchingDepts[0];
    setSelectedDeptId(firstDept?.id || firstDept?.code || '');

    // Auto-select first matching subject
    const matchingSubs = subjects.filter(s =>
      (!targetCol || s.college_id === targetCol.id || s.college_slug === targetSlug || String(s.colg_cd) === String(targetCode) || String(s.college_code) === String(targetCode)) &&
      (!firstDept || s.department_id === firstDept.id || s.department_code === firstDept.code || s.branch_cd === firstDept.branch_cd)
    );
    setSelectedSubjectId(matchingSubs[0]?.id || matchingSubs[0]?.code || '');

    // Reset faculty selection
    setSelectedFacultyId('');
    setEditingLinkId(null);
  };

  // Step 2: Change Department
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setEditingLinkId(null);

    const chosenDept = departments.find(d => d.id === deptId || d.code === deptId || d.branch_cd === deptId);

    // Filter available subjects for this department
    const matchingSubs = subjects.filter(s =>
      !deptId ||
      s.department_id === deptId ||
      s.department_code === deptId ||
      s.branch_cd === deptId ||
      (chosenDept && (s.department_id === chosenDept.id || s.department_code === chosenDept.code || s.branch_cd === chosenDept.branch_cd))
    );

    const firstSub = matchingSubs[0];
    setSelectedSubjectId(firstSub?.id || firstSub?.code || '');

    // Auto-complete faculty if pre-registered for this subject/department
    const matchingFaculty = faculties.find(f =>
      (firstSub && (f.subject_id === firstSub.id || f.subject_code === firstSub.code)) ||
      f.department_id === deptId ||
      f.department_code === deptId ||
      (chosenDept && (f.department_name === chosenDept.name || f.department_code === chosenDept.code))
    );

    if (matchingFaculty) {
      setSelectedFacultyId(matchingFaculty.id || matchingFaculty.emp_id);
    } else {
      setSelectedFacultyId('');
    }
  };

  // Step 3: Change Subject
  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);

    const subObj = subjects.find(s => s.id === subId || s.code === subId);
    if (subObj && subObj.department_id && !selectedDeptId) {
      setSelectedDeptId(subObj.department_id);
    }

    // Auto-complete faculty pre-registered with this subject
    const matchingFaculty = faculties.find(f =>
      f.subject_id === subId ||
      f.subject_code === subId ||
      (subObj && (f.subject_id === subObj.id || f.subject_code === subObj.code))
    );

    if (matchingFaculty) {
      setSelectedFacultyId(matchingFaculty.id || matchingFaculty.emp_id);
    }
  };

  // Step 4: Change Faculty
  const handleFacultyChange = (facId: string) => {
    setSelectedFacultyId(facId);
    const facObj = faculties.find(f => f.id === facId || f.emp_id === facId);

    if (facObj) {
      if (facObj.department_id && !selectedDeptId) {
        setSelectedDeptId(facObj.department_id);
      }
      if (facObj.subject_id && !selectedSubjectId) {
        setSelectedSubjectId(facObj.subject_id);
      }
    }
  };

  // Active objects for live spotlight preview card
  const activeCollege = colleges.find(c => String(c.code) === String(selectedCollegeId) || String(c.id) === String(selectedCollegeId) || c.slug === selectedCollegeSlug);
  const activeDept = departments.find(d => d.id === selectedDeptId || d.code === selectedDeptId || d.branch_cd === selectedDeptId);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId);
  const activeFaculty = faculties.find(f => f.id === selectedFacultyId || f.emp_id === selectedFacultyId);

  // Reset form
  const resetForm = () => {
    setEditingLinkId(null);
    setFacultySearchTerm('');
    if (formAvailableDepartments.length > 0) {
      const firstDept = formAvailableDepartments[0];
      setSelectedDeptId(firstDept.id || firstDept.code);
    }
    if (formAvailableSubjects.length > 0) {
      const firstSub = formAvailableSubjects[0];
      setSelectedSubjectId(firstSub.id || firstSub.code);
    }
    setSelectedFacultyId('');
  };

  // Edit Link Handler
  const handleEditLink = (link: FacultySubjectLink) => {
    setEditingLinkId(link.id);
    if (link.college_slug || link.college_code || link.college_id) {
      const targetCol = colleges.find(c => c.slug === link.college_slug || String(c.code) === String(link.college_code) || c.id === link.college_id);
      if (targetCol) {
        setSelectedCollegeId(targetCol.code || targetCol.id);
        setSelectedCollegeSlug(targetCol.slug);
      }
    }
    setSelectedFacultyId(link.faculty_id || link.faculty_code);
    setSelectedSubjectId(link.subject_id || link.subject_code);

    const sub = subjects.find(s => s.id === link.subject_id || s.code === link.subject_code);
    if (sub?.department_id || sub?.department_code) {
      setSelectedDeptId(sub.department_id || sub.department_code || '');
    }
  };

  // Save or Update Linkage
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedSubjectId) {
      showAlert('error', 'Please select a Subject and Faculty member.');
      return;
    }

    const facObj = faculties.find(f => f.id === selectedFacultyId || f.emp_id === selectedFacultyId);
    const subObj = subjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId);

    const realFacId = facObj?.id || selectedFacultyId;
    const realSubId = subObj?.id || selectedSubjectId;

    // Duplicate check
    const isDup = links.some(
      (l) => l.faculty_id === realFacId && l.subject_id === realSubId && l.id !== editingLinkId
    );
    if (isDup) {
      showAlert('error', 'This faculty member is already linked to this subject.');
      return;
    }

    setSaving(true);
    const isEdit = !!editingLinkId;
    const targetSlug = selectedCollegeSlug || 'srms-cet-bareilly';
    const url = isEdit
      ? `${API_BASE}/admin-master/faculty-subjects/${editingLinkId}?tenant=${targetSlug}`
      : `${API_BASE}/admin-master/faculty-subjects?tenant=${targetSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          facultyId: realFacId,
          subjectId: realSubId,
        }),
      });

      if (res.ok) {
        showAlert('success', `Faculty subject link ${isEdit ? 'updated' : 'saved'} in PostgreSQL successfully!`);
        resetForm();
        fetchLinks(selectedCollegeFilter);
      } else {
        const json = await res.json();
        showAlert('error', json.message || `Failed to ${isEdit ? 'update' : 'create'} link.`);
      }
    } catch (err) {
      showAlert('error', 'Network error during save operation.');
    } finally {
      setSaving(false);
    }
  };

  // Unlink / Delete
  const handleUnlink = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to remove this faculty subject link?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const targetSlug = itemCollegeSlug || selectedCollegeSlug || (selectedCollegeFilter !== 'all' ? selectedCollegeFilter : 'srms-cet-bareilly');

      const res = await fetch(`${API_BASE}/admin-master/faculty-subjects/${id}?tenant=${targetSlug}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        showAlert('success', 'Faculty subject link removed successfully from PostgreSQL!');
        if (editingLinkId === id) resetForm();
        fetchLinks(selectedCollegeFilter);
      } else {
        const json = await res.json();
        showAlert('error', json.message || 'Failed to remove link.');
      }
    } catch (err) {
      showAlert('error', 'Network error during delete.');
    }
  };

  // ─── COMBINED ROSTER TABLE ────────────────────────────────────────────────
  // Map Staff Master primary registered subjects
  const primaryRegisteredLinks: FacultySubjectLink[] = faculties
    .filter(f => f.subject_id || f.subject_name)
    .map(f => {
      const sub = subjects.find(s => s.id === f.subject_id || s.code === f.subject_code);
      const facCol = colleges.find(c => c.slug === f.college_slug || String(c.code) === String(f.college_code) || c.id === f.college_id);

      return {
        id: `primary-${f.id}`,
        faculty_id: f.id,
        subject_id: f.subject_id || sub?.id || '',
        faculty_name: f.name,
        faculty_code: f.emp_id,
        faculty_designation: f.designation || 'Faculty Member',
        faculty_department_name: f.department_name,
        faculty_department_code: f.department_code,
        subject_name: f.subject_name || sub?.name || 'Subject',
        subject_code: f.subject_code || sub?.code || 'SUB',
        subject_department_name: sub?.department_name || f.department_name,
        subject_department_code: sub?.department_code || f.department_code,
        college_id: facCol?.id || f.college_id,
        college_name: facCol?.name || f.college_name || 'SRMS CET,BAREILLY',
        college_code: facCol?.code || f.college_code || '1',
        college_slug: facCol?.slug || f.college_slug || 'srms-cet-bareilly',
        created_at: new Date().toISOString(),
        isPrimaryRegistered: true,
      };
    });

  // Merge explicit links with primary registered links and deduplicate
  const allDisplayLinks = useMemo(() => {
    const combined: FacultySubjectLink[] = [...links];

    primaryRegisteredLinks.forEach(pLink => {
      const existsInExplicit = combined.some(
        e => (e.faculty_id === pLink.faculty_id || e.faculty_code === pLink.faculty_code) &&
             (e.subject_id === pLink.subject_id || e.subject_code === pLink.subject_code)
      );
      if (!existsInExplicit) {
        combined.push(pLink);
      }
    });

    const seen = new Set<string>();
    const uniqueLinks: FacultySubjectLink[] = [];
    for (const l of combined) {
      const key = `${l.faculty_code || l.faculty_id}-${l.subject_code || l.subject_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLinks.push(l);
      }
    }
    return uniqueLinks;
  }, [links, primaryRegisteredLinks]);

  // Filter linked items for roster table
  const filteredLinks = useMemo(() => {
    return allDisplayLinks.filter((link) => {
      // 1. College Filter
      if (selectedCollegeFilter !== 'all') {
        const targetCol = colleges.find(c => String(c.code) === String(selectedCollegeFilter) || String(c.id) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter);
        const targetColCode = targetCol?.code || selectedCollegeFilter;
        const targetColSlug = targetCol?.slug || selectedCollegeFilter;
        const targetColId = targetCol?.id || selectedCollegeFilter;

        const isColMatch =
          String(link.college_code) === String(targetColCode) ||
          link.college_slug === targetColSlug ||
          link.college_id === targetColId ||
          (targetCol && (link.college_id === targetCol.id || link.college_slug === targetCol.slug || String(link.college_code) === String(targetCol.code)));
        if (!isColMatch) return false;
      }

      // 2. Department Filter
      if (selectedDeptFilter !== 'all') {
        const chosenDept = departments.find(d => d.id === selectedDeptFilter || d.code === selectedDeptFilter || d.name === selectedDeptFilter);
        const isDeptMatch =
          link.faculty_department_name === selectedDeptFilter ||
          link.subject_department_name === selectedDeptFilter ||
          link.faculty_department_code === selectedDeptFilter ||
          link.subject_department_code === selectedDeptFilter ||
          (chosenDept && (
            link.faculty_department_name === chosenDept.name ||
            link.subject_department_name === chosenDept.name ||
            link.faculty_department_code === chosenDept.code ||
            link.subject_department_code === chosenDept.code
          ));
        if (!isDeptMatch) return false;
      }

      // 3. Search Term Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          link.faculty_name.toLowerCase().includes(term) ||
          link.faculty_code.toLowerCase().includes(term) ||
          link.subject_name.toLowerCase().includes(term) ||
          link.subject_code.toLowerCase().includes(term) ||
          (link.faculty_department_name && link.faculty_department_name.toLowerCase().includes(term)) ||
          (link.college_name && link.college_name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allDisplayLinks, selectedCollegeFilter, selectedDeptFilter, searchTerm, colleges, departments]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Subject Linker" />
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

          {/* Metric Stats Header adhering to Theme.md */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">Registered Staff</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{faculties.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Staff Master Active Roster</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF]/10 border border-[#5B4BFF]/20 flex items-center justify-center text-[#5B4BFF] text-xl font-bold">
                👨‍🏫
              </div>
            </div>

            <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-[#F36C21] tracking-wider">Total Subject Links</p>
                <p className="text-2xl font-black text-[#F36C21] mt-1">{allDisplayLinks.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Primary + Mapped Linkages</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F36C21] text-xl font-bold">
                🔗
              </div>
            </div>

            <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-[#00C48C] tracking-wider">Mapped Departments</p>
                <p className="text-2xl font-black text-[#00C48C] mt-1">{departments.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Department Master Database</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C48C] text-xl font-bold">
                🏛️
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Panel: Step-by-Step Cascading Linker Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                
                {/* Form Header */}
                <div className="flex justify-between items-start border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="text-[#F36C21]">⚡</span>
                      <span>{editingLinkId ? 'Edit Subject Linkage' : 'Link Faculty & Subject'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                      Choose College &rarr; Department &rarr; Subject &rarr; Faculty.
                    </p>
                  </div>
                  {editingLinkId && (
                    <button
                      onClick={resetForm}
                      className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSave} className="space-y-4">

                  {/* STEP 1: Select College */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1">
                      <span>1.</span> Choose College First *
                    </label>
                    <select
                      required
                      value={selectedCollegeId}
                      onChange={(e) => handleCollegeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold transition-all"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.code || c.id}>
                          🏛️ [#{c.code || c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* STEP 2: Select Department */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1">
                      <span>2.</span> Choose Department ({formAvailableDepartments.length}) *
                    </label>
                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        required
                        value={selectedDeptId}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold transition-all"
                      >
                        <option value="">-- Select Department --</option>
                        {formAvailableDepartments.map((dept) => (
                          <option key={dept.id} value={dept.id || dept.code}>
                            🏢 {dept.name} ({dept.code || dept.branch_cd || 'N/A'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* STEP 3: Select Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1">
                      <span>3.</span> Choose Department Subject ({formAvailableSubjects.length}) *
                    </label>
                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        required
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold transition-all"
                      >
                        <option value="">-- Choose Subject --</option>
                        {formAvailableSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id || sub.code}>
                            📚 {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* STEP 4: Search & Select Faculty Member */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1">
                        <span>4.</span> Faculty Member ({formAvailableFaculties.length}) *
                      </label>
                      {activeFaculty && (
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          ✨ Auto-Selected
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Search faculty name or staff code..."
                      value={facultySearchTerm}
                      onChange={(e) => setFacultySearchTerm(e.target.value)}
                      className="w-full px-3.5 py-1.5 mb-1 text-[11px] rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-900 dark:text-white placeholder:text-slate-400"
                    />

                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        required
                        value={selectedFacultyId}
                        onChange={(e) => handleFacultyChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-xs text-slate-900 dark:text-white font-bold transition-all"
                      >
                        <option value="">-- Select Faculty Member --</option>
                        {formAvailableFaculties.map((fac) => (
                          <option key={fac.id} value={fac.id || fac.emp_id}>
                            👤 {fac.name} ({fac.emp_id}) {fac.department_name ? `[${fac.department_name}]` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Active Selection Live Spotlight Card */}
                  {activeFaculty && activeSubject && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5B4BFF]/10 via-white to-purple-500/10 dark:from-[#2D2575]/40 dark:via-slate-900 dark:to-purple-950/40 border border-[#5B4BFF]/30 space-y-3 shadow-md animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-[#5B4BFF]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-0.5">
                          {activeFaculty.photo_url ? (
                            <img src={activeFaculty.photo_url} alt={activeFaculty.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="font-black text-[#5B4BFF] text-xs">
                              {activeFaculty.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs">{activeFaculty.name}</p>
                          <p className="text-[10px] text-[#5B4BFF] font-semibold">{activeFaculty.designation || 'Faculty Member'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Assigned Subject:</span>
                          <span className="text-[#5B4BFF] font-bold">{activeSubject.name} ({activeSubject.code})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Department Link:</span>
                          {activeFaculty.department_name === activeSubject.department_name ? (
                            <span className="px-2 py-0.5 rounded bg-[#5B4BFF]/15 text-[#5B4BFF] border border-[#5B4BFF]/30 font-bold uppercase text-[9px]">
                              🏠 Home Dept
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[9px]">
                              🌐 Cross-Dept Link
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button adhering to Theme.md */}
                  <button
                    type="submit"
                    disabled={saving || metadataLoading}
                    className="w-full py-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs shadow-md shadow-[#5B4BFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                  >
                    {saving ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      <span>💾</span>
                    )}
                    <span>{editingLinkId ? 'Update Subject Linkage' : 'Save Subject Linkage'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Panel: List of Links (Pre-Registered Staff Master + Mapped Links) */}
            <div className="lg:col-span-2 space-y-4">

              {/* Table Search, College Filter & Department Filter */}
              <div className="bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 p-4 rounded-[22px] flex flex-col md:flex-row gap-3 items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                
                {/* 1. Search Box */}
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search faculty or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] w-full text-slate-900 dark:text-white placeholder:text-slate-400 pl-9"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* 2. College Filter */}
                  <select
                    value={selectedCollegeFilter}
                    onChange={(e) => { setSelectedCollegeFilter(e.target.value); setSelectedDeptFilter('all'); }}
                    className="px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="all">🏛️ All Colleges ({colleges.length})</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.code || col.id}>
                        🏛️ [#{col.code || col.id}] {col.name}
                      </option>
                    ))}
                  </select>

                  {/* 3. Department Filter */}
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="all">🏢 All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Table Card */}
              <div className="bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50 dark:bg-slate-800/50">
                        <th className="pl-6 py-4">Faculty Member</th>
                        <th className="py-4">College & Dept</th>
                        <th className="py-4">Linked Subject</th>
                        <th className="py-4">Source / Classification</th>
                        <th className="pr-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                      {loading ? (
                        [...Array(4)].map((_, rIdx) => (
                          <tr key={rIdx} className="animate-pulse bg-slate-50/50 dark:bg-slate-900/20">
                            <td className="pl-6 py-4">
                              <div className="space-y-2">
                                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded w-20"></div>
                              </div>
                            </td>
                            <td className="py-4"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                            <td className="py-4">
                              <div className="space-y-2">
                                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded w-16"></div>
                              </div>
                            </td>
                            <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                            <td className="pr-6 py-4 text-right">
                              <div className="w-12 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredLinks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-14 text-center text-slate-400 font-medium">
                            No faculty subject links found matching the filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLinks.map((link) => {
                          const matchedCol = colleges.find(c => c.slug === link.college_slug || String(c.code) === String(link.college_code) || c.id === link.college_id);
                          const displayColName = matchedCol?.name || link.college_name || 'SRMS CET,BAREILLY';
                          const displayColCode = matchedCol?.code || link.college_code || '1';

                          return (
                            <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                              <td className="pl-6 py-4">
                                <div>
                                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">{link.faculty_name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="font-mono font-bold">{link.faculty_code}</span> | {link.faculty_designation || 'Faculty Member'}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4">
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-[#F36C21] border border-orange-500/20 font-bold text-[9px] inline-block">
                                    🏛️ [#{displayColCode}] {displayColName}
                                  </span>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    🏢 {link.faculty_department_name || 'General Dept'}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{link.subject_name}</p>
                                  <p className="text-[10px] text-[#5B4BFF] font-bold font-mono">
                                    📚 Code: {link.subject_code} {link.subject_department_name ? `(${link.subject_department_name})` : ''}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4">
                                {link.isPrimaryRegistered ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/15 text-[#5B4BFF] border border-[#5B4BFF]/30 font-extrabold uppercase text-[9px] tracking-wider inline-block">
                                    🏛️ Staff Master Primary
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-extrabold uppercase text-[9px] tracking-wider inline-block">
                                    🔗 Subject Linker
                                  </span>
                                )}
                              </td>

                              <td className="pr-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!link.isPrimaryRegistered && (
                                    <button
                                      onClick={() => handleEditLink(link)}
                                      className="p-1.5 rounded-xl bg-[#5B4BFF]/10 hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white transition-all border border-[#5B4BFF]/30 shadow-sm"
                                      title="Edit Linkage"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                      </svg>
                                    </button>
                                  )}
                                  {!link.isPrimaryRegistered && (
                                    <button
                                      onClick={() => handleUnlink(link.id, link.college_slug)}
                                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-500/30 shadow-sm"
                                      title="Unlink Subject"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  )}
                                  {link.isPrimaryRegistered && (
                                    <span className="text-[10px] text-slate-400 font-bold italic">Primary</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
