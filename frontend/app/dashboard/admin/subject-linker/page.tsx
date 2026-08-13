'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  designation?: string;
  department_id?: string;
  department_name?: string;
  subject_id?: string;
  subject_name?: string;
  photo_url?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
}

interface FacultySubjectLink {
  id: string;
  faculty_id: string;
  subject_id: string;
  faculty_name: string;
  faculty_code: string;
  faculty_designation?: string;
  faculty_department_name?: string;
  subject_name: string;
  subject_code: string;
  subject_department_name?: string;
  created_at: string;
  isPrimaryRegistered?: boolean;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

const API_BASE = 'http://localhost:3001/api/v1';
const TENANT = 'srms-ims';

export default function SubjectLinkerPage() {
  const [links, setLinks] = useState<FacultySubjectLink[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Step-by-Step Form states (Department -> Subject -> Faculty Auto-Complete)
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  
  // Edit mode state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Table Filters & Loading
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-master/faculty-subjects?tenant=${TENANT}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLinks(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch linked subjects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    setMetadataLoading(true);
    try {
      const [facRes, subRes, deptRes] = await Promise.all([
        fetch(`${API_BASE}/users/faculty?tenant=${TENANT}&limit=100`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${TENANT}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        }),
        fetch(`${API_BASE}/users/departments?tenant=${TENANT}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        })
      ]);

      if (facRes.ok) {
        const facJson = await facRes.json();
        const rawList = facJson.data?.data || facJson.data || facJson;
        setFaculties(Array.isArray(rawList) ? rawList : []);
      }
      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubjects(subJson.data || subJson);
      }
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        setDepartments(deptJson.data || deptJson);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown datasets', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
    fetchDropdownData();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ─── STEP 1: Department Selection ──────────────────────────────────────────
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedSubjectId('');
    setSelectedFacultyId('');
    setEditingLinkId(null);

    // If department selected, pre-select first subject in that department if available
    const deptSubs = subjects.filter(s => !deptId || s.department_id === deptId);
    if (deptSubs.length > 0) {
      const firstSub = deptSubs[0];
      setSelectedSubjectId(firstSub.id);
      
      // Auto-complete faculty for this subject/department
      const matchingFaculty = faculties.find(f => f.subject_id === firstSub.id) ||
                              faculties.find(f => f.department_id === deptId);
      if (matchingFaculty) {
        setSelectedFacultyId(matchingFaculty.id);
      }
    }
  };

  // ─── STEP 2: Subject Selection & Auto-Complete Faculty ───────────────────────
  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    
    const subObj = subjects.find(s => s.id === subId);
    if (subObj && subObj.department_id && !selectedDeptId) {
      setSelectedDeptId(subObj.department_id);
    }

    // AUTO-COMPLETE FACULTY: Find faculty pre-registered with this subject or department in Staff Master!
    const matchingFaculty = faculties.find(f => f.subject_id === subId) || 
                            faculties.find(f => f.department_id === (subObj?.department_id || selectedDeptId));
    
    if (matchingFaculty) {
      setSelectedFacultyId(matchingFaculty.id);
    }
  };

  // ─── STEP 3: Faculty Selection ──────────────────────────────────────────────
  const handleFacultyChange = (facId: string) => {
    setSelectedFacultyId(facId);
    const facObj = faculties.find(f => f.id === facId);
    
    // Auto-complete department and primary subject if available
    if (facObj) {
      if (facObj.department_id && !selectedDeptId) {
        setSelectedDeptId(facObj.department_id);
      }
      if (facObj.subject_id && !selectedSubjectId) {
        setSelectedSubjectId(facObj.subject_id);
      }
    }
  };

  // Filter subjects by chosen Department
  const availableFormSubjects = subjects.filter(s => {
    if (!selectedDeptId) return true;
    return s.department_id === selectedDeptId || !s.department_id;
  });

  // Filter faculties by search term or department
  const availableFormFaculties = faculties.filter(f => {
    const matchesSearch = 
      !facultySearchTerm ||
      f.name.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
      f.emp_id.toLowerCase().includes(facultySearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Active objects for live preview spotlight
  const activeFaculty = faculties.find(f => f.id === selectedFacultyId);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeDept = departments.find(d => d.id === selectedDeptId);

  // Reset form
  const resetForm = () => {
    setSelectedDeptId('');
    setSelectedSubjectId('');
    setSelectedFacultyId('');
    setFacultySearchTerm('');
    setEditingLinkId(null);
  };

  // Edit Link Handler
  const handleEditLink = (link: FacultySubjectLink) => {
    setEditingLinkId(link.id);
    setSelectedFacultyId(link.faculty_id);
    setSelectedSubjectId(link.subject_id);
    
    const sub = subjects.find(s => s.id === link.subject_id);
    if (sub?.department_id) {
      setSelectedDeptId(sub.department_id);
    }
  };

  // Save or Update Linkage
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedSubjectId) {
      showAlert('error', 'Please select a Subject and Faculty member.');
      return;
    }
    
    // Check duplicate
    const isDup = links.some(
      (l) => l.faculty_id === selectedFacultyId && l.subject_id === selectedSubjectId && l.id !== editingLinkId
    );
    if (isDup) {
      showAlert('error', 'This faculty member is already linked to this subject.');
      return;
    }

    setSaving(true);
    const isEdit = !!editingLinkId;
    const url = isEdit 
      ? `${API_BASE}/admin-master/faculty-subjects/${editingLinkId}?tenant=${TENANT}`
      : `${API_BASE}/admin-master/faculty-subjects?tenant=${TENANT}`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          facultyId: selectedFacultyId,
          subjectId: selectedSubjectId,
        }),
      });

      if (res.ok) {
        showAlert('success', `Faculty subject link ${isEdit ? 'updated' : 'saved'} successfully!`);
        resetForm();
        fetchLinks();
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
  const handleUnlink = async (id: string) => {
    if (!confirm('Are you sure you want to remove this faculty subject link?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin-master/faculty-subjects/${id}?tenant=${TENANT}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        showAlert('success', 'Link removed successfully!');
        if (editingLinkId === id) resetForm();
        fetchLinks();
      } else {
        const json = await res.json();
        showAlert('error', json.message || 'Failed to remove link.');
      }
    } catch (err) {
      showAlert('error', 'Network error during delete.');
    }
  };

  // ─── COMBINED ROSTER TABLE: Staff Master Registered + Explicit Linkages ───
  // Map Staff Master primary registered subjects (e.g. Dr. Sanjay Singh -> Physiology)
  const primaryRegisteredLinks: FacultySubjectLink[] = faculties
    .filter(f => f.subject_id && f.subject_name)
    .map(f => {
      const sub = subjects.find(s => s.id === f.subject_id);
      return {
        id: `primary-${f.id}`,
        faculty_id: f.id,
        subject_id: f.subject_id!,
        faculty_name: f.name,
        faculty_code: f.emp_id,
        faculty_designation: f.designation,
        faculty_department_name: f.department_name,
        subject_name: f.subject_name!,
        subject_code: sub?.code || 'SUB',
        subject_department_name: sub?.department_name || f.department_name,
        created_at: new Date().toISOString(),
        isPrimaryRegistered: true,
      };
    });

  // Merge explicit links with primary registered links (avoiding duplicate rows)
  const allDisplayLinks: FacultySubjectLink[] = [...links];

  primaryRegisteredLinks.forEach(pLink => {
    const existsInExplicit = allDisplayLinks.some(
      e => e.faculty_id === pLink.faculty_id && e.subject_id === pLink.subject_id
    );
    if (!existsInExplicit) {
      allDisplayLinks.push(pLink);
    }
  });

  // Filter linked items for roster table
  const filteredLinks = allDisplayLinks.filter((link) => {
    const matchesSearch = 
      link.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.subject_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = 
      selectedDeptFilter === 'all' || 
      link.faculty_department_name === selectedDeptFilter ||
      link.subject_department_name === selectedDeptFilter;
      
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Subject Linker" />
        <main className="p-6 space-y-6 flex-1 bg-slate-50 dark:bg-[#0F172A]">
          
          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center gap-2 ${
              alert.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Metric Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Registered Staff</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{faculties.length}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Staff Master Roster</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                👨‍🏫
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Total Subject Links</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{allDisplayLinks.length}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Primary + Mapped Links</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xl font-bold">
                🔗
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Active Departments</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{departments.length}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Department Master</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                🏛️
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Step-by-Step Cascading Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md hover:shadow-lg transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>⚡</span>
                      <span>{editingLinkId ? 'Edit Subject Linkage' : 'Link Faculty & Subject'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Choose Department first, select Department Subject, then Faculty is automatically auto-completed.
                    </p>
                  </div>
                  {editingLinkId && (
                    <button 
                      onClick={resetForm}
                      className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  
                  {/* STEP 1: Select Department */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                      <span>1.</span> Choose Department First *
                    </label>
                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        value={selectedDeptId}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="" className="bg-slate-900 text-white">-- Select Department --</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* STEP 2: Select Subject (Filtered by Department) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                      <span>2.</span> Choose Department Subject *
                    </label>
                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        required
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="" className="bg-slate-900 text-white">-- Choose Subject --</option>
                        {availableFormSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                            {sub.name} ({sub.code}) {sub.department_name ? `[${sub.department_name}]` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* STEP 3: Search / Select Faculty (With Auto-Complete) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                        <span>3.</span> Faculty Member (Auto-Completed) *
                      </label>
                      {activeFaculty && (
                        <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wide">
                          ✨ Auto-Selected
                        </span>
                      )}
                    </div>
                    
                    {/* Faculty Search Filter input */}
                    <input
                      type="text"
                      placeholder="Search faculty name or code..."
                      value={facultySearchTerm}
                      onChange={(e) => setFacultySearchTerm(e.target.value)}
                      className="w-full px-3 py-1.5 mb-1 text-[11px] rounded-lg bg-slate-900/80 border border-slate-700/60 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-500"
                    />

                    {metadataLoading ? (
                      <div className="h-10 w-full bg-slate-800 animate-pulse rounded-xl"></div>
                    ) : (
                      <select
                        required
                        value={selectedFacultyId}
                        onChange={(e) => handleFacultyChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="" className="bg-slate-900 text-white">-- Select Faculty Member --</option>
                        {availableFormFaculties.map((fac) => (
                          <option key={fac.id} value={fac.id} className="bg-slate-900 text-white">
                            {fac.name} ({fac.emp_id}) {fac.department_name ? `[${fac.department_name}]` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Active Selection Live Spotlight Card */}
                  {activeFaculty && activeSubject && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/30 space-y-3 shadow-lg animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-indigo-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                          {activeFaculty.photo_url ? (
                            <img src={activeFaculty.photo_url} alt={activeFaculty.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="font-black text-indigo-400 text-xs">
                              {activeFaculty.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs">{activeFaculty.name}</p>
                          <p className="text-[10px] text-indigo-400 font-semibold">{activeFaculty.designation || 'Faculty Member'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Assigned Subject:</span>
                          <span className="text-purple-300 font-bold">{activeSubject.name} ({activeSubject.code})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Department Match:</span>
                          {activeFaculty.department_name === activeSubject.department_name ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold uppercase text-[9px]">
                              🏠 Home Dept
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[9px]">
                              🌐 Cross-Dept Link
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving || metadataLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs border border-indigo-400/30 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                  >
                    {saving ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      <span>💾</span>
                    )}
                    <span>{editingLinkId ? 'Update Linkage' : 'Save Subject Linkage'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Panel: List of Links (Pre-Registered Staff Master + Mapped Links) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Table Search & Department Filter */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xl">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search faculty or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full text-white placeholder:text-slate-500 transition-all pl-9"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                
                {metadataLoading ? (
                  <div className="h-9 w-44 bg-slate-800 animate-pulse rounded-xl"></div>
                ) : (
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-medium w-full sm:w-auto"
                  >
                    <option value="all" className="bg-slate-900 text-white">Filter Department (All)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name} className="bg-slate-900 text-white">{dept.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Roster Table */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-indigo-500/20 text-indigo-300 font-extrabold uppercase text-[10px] tracking-wider bg-indigo-950/40">
                        <th className="pl-6 py-4">Faculty Member</th>
                        <th className="py-4">Linked Subject</th>
                        <th className="py-4">Source / Classification</th>
                        <th className="pr-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loading ? (
                        [...Array(4)].map((_, rIdx) => (
                          <tr key={rIdx} className="animate-pulse bg-slate-900/20">
                            <td className="pl-6 py-4">
                              <div className="space-y-2">
                                <div className="h-3.5 bg-slate-800 rounded w-28"></div>
                                <div className="h-2.5 bg-slate-900 rounded w-20"></div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="space-y-2">
                                <div className="h-3.5 bg-slate-800 rounded w-32"></div>
                                <div className="h-2.5 bg-slate-900 rounded w-16"></div>
                              </div>
                            </td>
                            <td className="py-4"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                            <td className="pr-6 py-4 text-right">
                              <div className="w-12 h-7 bg-slate-800 rounded-lg ml-auto"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredLinks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                            No faculty subject links found matching the filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLinks.map((link) => (
                          <tr key={link.id} className="hover:bg-indigo-950/30 border-b border-slate-800/40 transition-all group">
                            <td className="pl-6 py-4">
                              <div>
                                <p className="font-extrabold text-white text-sm">{link.faculty_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  <span className="font-mono">{link.faculty_code}</span> | {link.faculty_department_name || 'No Dept'}
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              <div>
                                <p className="font-bold text-slate-200">{link.subject_name}</p>
                                <p className="text-[10px] text-indigo-400 font-bold font-mono">
                                  {link.subject_code} {link.subject_department_name ? `(${link.subject_department_name})` : ''}
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              {link.isPrimaryRegistered ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-extrabold uppercase text-[9px] tracking-wider inline-block">
                                  🏛️ Staff Master Primary
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold uppercase text-[9px] tracking-wider inline-block">
                                  🔗 Subject Linker
                                </span>
                              )}
                            </td>
                            <td className="pr-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!link.isPrimaryRegistered && (
                                  <button
                                    onClick={() => handleEditLink(link)}
                                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/30"
                                    title="Edit Linkage"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                )}
                                {!link.isPrimaryRegistered && (
                                  <button
                                    onClick={() => handleUnlink(link.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30"
                                    title="Unlink Subject"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                )}
                                {link.isPrimaryRegistered && (
                                  <span className="text-[10px] text-slate-500 font-bold italic">Primary</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
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
