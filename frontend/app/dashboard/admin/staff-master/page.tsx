'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department_id?: string;
  department_name?: string;
  subject_id?: string;
  subject_name?: string;
  gender?: string;
  experience?: string;
  staff_type: string;
  is_active: boolean;
  photo_url?: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-ims';
  }
  return 'srms-ims';
};

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
  'Other / Custom',
];

export default function StaffMasterPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStaffType, setSelectedStaffType] = useState('all');
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

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/users/faculty?tenant=${slug}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data?.data || json.data || json;
        if (Array.isArray(dataList)) {
          setFaculties(dataList);
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff list', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    setMetadataLoading(true);
    try {
      const slug = getTenantSlug();
      const [deptRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/users/departments?tenant=${slug}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        })
      ]);
      
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        const deptList = deptJson.data || deptJson;
        setDepartments(Array.isArray(deptList) ? deptList : []);
      }
      if (subRes.ok) {
        const subJson = await subRes.json();
        const subList = subJson.data || subJson;
        setSubjects(Array.isArray(subList) ? subList : []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown metadata', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchMetadata();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Convert uploaded photo file to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // Filter subjects based on selected Department in the Form
  const filteredFormSubjects = subjects.filter((sub) => {
    if (!formData.departmentId) return true;
    return !sub.department_id || sub.department_id === formData.departmentId;
  });

  const handleDepartmentChangeInForm = (deptId: string) => {
    const matchingSubs = subjects.filter((s) => !deptId || !s.department_id || s.department_id === deptId);
    const isCurrentSubjectValid = matchingSubs.some((s) => s.id === formData.subjectId);
    
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      subjectId: isCurrentSubjectValid ? prev.subjectId : ''
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
    setFormData({
      empId: '',
      name: '',
      email: '',
      password: '',
      phone: '',
      designation: 'Assistant Professor',
      departmentId: departments[0]?.id || '',
      subjectId: '',
      gender: 'Male',
      experience: '',
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

    setFormData({
      empId: item.emp_id,
      name: item.name,
      email: item.email || '',
      password: '', 
      phone: item.phone || '',
      designation: item.designation || 'Assistant Professor',
      departmentId: item.department_id || '',
      subjectId: item.subject_id || '',
      gender: item.gender || 'Male',
      experience: item.experience || '',
      staffType: item.staff_type || 'Faculty',
      photoUrl: item.photo_url || '',
      isActive: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This will remove their user account.')) return;
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/users/faculty/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      if (res.ok) {
        showAlert('success', 'Staff member deleted successfully from PostgreSQL!');
        fetchFaculties();
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

    const slug = getTenantSlug();
    const url = isEdit 
      ? `${API_BASE}/users/faculty/${editingItem.id}?tenant=${slug}` 
      : `${API_BASE}/users/faculty?tenant=${slug}`;
    const method = isEdit ? 'PUT' : 'POST';

    // Construct request body
    const finalDesignation = selectedDesignationOption === 'Other / Custom' 
      ? customDesignationText 
      : selectedDesignationOption;

    const body: Record<string, any> = { 
      ...formData,
      departmentId: formData.departmentId || undefined,
      subjectId: formData.subjectId || undefined,
      designation: finalDesignation,
      role: roleMapping[formData.staffType] || 'FACULTY'
    };
    
    if (isEdit) {
      delete body.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showAlert('success', `Staff member profile ${isEdit ? 'updated' : 'registered'} in PostgreSQL!`);
        setIsModalOpen(false);
        fetchFaculties();
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
  const filteredFaculties = faculties.filter((fac) => {
    const matchesSearch = 
      fac.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fac.emp_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || fac.department_id === selectedDept;
    const matchesType = selectedStaffType === 'all' || fac.staff_type.toLowerCase() === selectedStaffType.toLowerCase();
    return matchesSearch && matchesDept && matchesType;
  });

  // Pagination helper
  const totalPages = Math.ceil(filteredFaculties.length / ITEMS_PER_PAGE);
  const paginatedFaculties = filteredFaculties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Staff Master Administration" />
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

          {/* Filters Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search staff code, name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full text-white placeholder:text-slate-500 transition-all pl-9"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              
              {metadataLoading ? (
                <div className="h-9 w-36 bg-slate-800 animate-pulse rounded-xl"></div>
              ) : (
                <select
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-medium"
                >
                  <option value="all" className="bg-slate-900 text-white">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">{dept.name}</option>
                  ))}
                </select>
              )}

              <select
                value={selectedStaffType}
                onChange={(e) => { setSelectedStaffType(e.target.value); setCurrentPage(1); }}
                className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">All Staff Types</option>
                {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG'].map((type) => (
                  <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add New Staff Member
            </button>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-indigo-500/20 text-indigo-300 font-extrabold uppercase text-[10px] tracking-wider bg-indigo-950/40">
                    <th className="pl-6 py-4">Staff Info</th>
                    <th className="py-4">Code</th>
                    <th className="py-4">Type & Role</th>
                    <th className="py-4">Dept / Specialty Subject</th>
                    <th className="py-4">Experience & Contact</th>
                    <th className="py-4">Status</th>
                    <th className="pr-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-slate-900/20">
                        <td className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800"></div>
                            <div className="space-y-2">
                              <div className="h-3.5 bg-slate-800 rounded w-28"></div>
                              <div className="h-2.5 bg-slate-900 rounded w-16"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4"><div className="h-3 bg-slate-800 rounded w-14"></div></td>
                        <td className="py-4"><div className="h-5 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4">
                          <div className="space-y-1.5">
                            <div className="h-3 bg-slate-800 rounded w-24"></div>
                            <div className="h-2.5 bg-slate-900 rounded w-16"></div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="space-y-1.5">
                            <div className="h-3 bg-slate-800 rounded w-20"></div>
                            <div className="h-2.5 bg-slate-900 rounded w-14"></div>
                          </div>
                        </td>
                        <td className="py-4"><div className="h-4 bg-slate-800 rounded w-12"></div></td>
                        <td className="pr-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <div className="w-7 h-7 bg-slate-800 rounded-lg"></div>
                            <div className="w-7 h-7 bg-slate-800 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedFaculties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No staff records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedFaculties.map((fac) => (
                      <tr key={fac.id} className="hover:bg-indigo-950/30 border-b border-slate-800/40 transition-all group">
                        <td className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-md group-hover:border-indigo-400 transition-colors p-0.5">
                              {fac.photo_url ? (
                                <img src={fac.photo_url} alt={fac.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="font-black text-indigo-400 text-xs">
                                  {fac.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-white tracking-tight text-sm">{fac.name}</p>
                              <p className="text-[11px] text-indigo-400 font-semibold">{fac.designation || 'Staff Member'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-mono font-bold text-slate-300">{fac.emp_id}</td>
                        <td className="py-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-extrabold uppercase text-[9px] tracking-wider inline-block">
                              {fac.staff_type}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">{fac.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-extrabold text-[10px] inline-block">
                              {fac.department_name || 'No Dept'}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {fac.subject_name ? `Specialty: ${fac.subject_name}` : 'No Specialty Subject'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-slate-200">{fac.phone || 'No Mobile'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{fac.experience ? `${fac.experience} Exp.` : 'Exp: N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[9px] tracking-wide inline-block ${
                            fac.is_active 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {fac.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="pr-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(fac)}
                              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/30 shadow-sm"
                              title="Edit Staff Member"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteItem(fac.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30 shadow-sm"
                              title="Delete Staff Member"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-800/80 bg-slate-900/40">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFaculties.length)} of {filteredFaculties.length} staff profiles
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold disabled:opacity-40 transition-all text-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ULTRA-PREMIUM GLASSMORPHISM MODAL WITH LIVE PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden shadow-2xl rounded-3xl bg-[#0F172A] border border-indigo-500/30 text-slate-100 flex flex-col max-h-[92vh]">
            
            {/* Header with gradient accent */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 uppercase flex items-center gap-2">
                  <span>🏛️</span>
                  <span>{editingItem ? 'Update Faculty Profile' : 'Register New Staff Member'}</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">Provide administrative credentials, department links, and role assignments.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/60 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split layout inside form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Left Column: Live Preview Card & Image Upload Widget */}
              <div className="w-full md:w-80 border-r border-indigo-500/20 p-6 flex flex-col justify-between bg-slate-950/50 space-y-6">
                
                {/* Live Card Preview */}
                <div className="w-full space-y-3">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Live Profile Card</span>
                  
                  <div className="w-full rounded-2xl bg-gradient-to-b from-indigo-900/30 via-slate-900/90 to-purple-950/30 border border-indigo-500/30 p-5 flex flex-col items-center text-center space-y-3 relative overflow-hidden backdrop-blur-md shadow-2xl shadow-indigo-950/50">
                    
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        formData.isActive 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Image Avatar Container */}
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20 relative group mt-2">
                      <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center relative">
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
                            <svg className="w-8 h-8 text-indigo-400 mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">No Photo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-0.5">
                      <h4 className="font-black text-base text-white tracking-tight leading-snug drop-shadow-sm truncate">
                        {formData.name || 'Full Name'}
                      </h4>
                      <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                        {formData.designation || 'Designation'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 inline-block">
                        {formData.empId || 'EMPCODE'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 w-full flex flex-col items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-extrabold uppercase text-[9px] tracking-wider">
                        {formData.staffType} ({formData.gender})
                      </span>
                      {formData.departmentId && (
                        <span className="text-[10px] text-purple-300 font-medium">
                          {departments.find(d => d.id === formData.departmentId)?.name || 'Department Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Upload Widget */}
                <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Upload Profile Photo</span>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 rounded-2xl cursor-pointer bg-indigo-950/20 hover:bg-indigo-900/30 transition-all p-3 text-center group">
                    <svg className="w-6 h-6 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                    <span className="text-[11px] text-slate-200 font-bold">Upload Photo File</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">PNG, JPG up to 2MB (Base64)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Dynamic Form Fields */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900/40">
                
                {/* 1. General Credentials */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                    <span>🔑</span> Account Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Staff Code */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Staff Code *</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingItem}
                        value={formData.empId}
                        onChange={(e) => setFormData({ ...formData, empId: e.target.value.toUpperCase() })}
                        placeholder="e.g. EMP1004"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>

                    {/* Faculty Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Faculty Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Sarah Sharma"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Email Address *</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingItem}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. sarah.sharma@srms.edu"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                        {editingItem ? 'Password (Locked)' : 'Account Password *'}
                      </label>
                      <input
                        type="password"
                        required={!editingItem}
                        disabled={!!editingItem}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingItem ? '••••••••' : 'Min 8 chars, strong'}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Professional Assignment & Department/Subject Master Fetch */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                    <span>🩺</span> Professional Assignments & Masters
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Staff Type */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Staff Type *</label>
                      <select
                        value={formData.staffType}
                        onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        {['Faculty', 'HOD', 'ADMIN', 'CLERK', 'EXECUTIVE', 'TUTOR', 'PG'].map((type) => (
                          <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Designation Dropdown List */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Designation *</label>
                      <select
                        value={selectedDesignationOption}
                        onChange={(e) => handleDesignationSelect(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        {STANDARD_DESIGNATIONS.map((desig) => (
                          <option key={desig} value={desig} className="bg-slate-900 text-white">{desig}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Designation text field (if "Other / Custom" selected) */}
                    {selectedDesignationOption === 'Other / Custom' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider">Custom Designation Title *</label>
                        <input
                          type="text"
                          required
                          value={customDesignationText}
                          onChange={(e) => handleCustomDesignationChange(e.target.value)}
                          placeholder="e.g. Senior Medical Scientist"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/50 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                        />
                      </div>
                    )}

                    {/* Department (Fetched from Department Master) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                        Department (Department Master) *
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => handleDepartmentChangeInForm(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="" className="bg-slate-900 text-white">No Department Assigned</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">{dept.name} ({dept.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Specialty Subject (Fetched from Subject Master & Filtered) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                        Specialty Subject (Subject Master)
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="" className="bg-slate-900 text-white">No specialty subject</option>
                        {filteredFormSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* 3. Personal & Demographics */}
                <div className="space-y-3.5">
                  <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                    <span>👤</span> Personal & Demographics
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                      >
                        <option value="Male" className="bg-slate-900 text-white">Male</option>
                        <option value="Female" className="bg-slate-900 text-white">Female</option>
                        <option value="Other" className="bg-slate-900 text-white">Other</option>
                      </select>
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Experience</label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 5 Years"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Mobile Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Access Toggle & Form Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-indigo-500/20">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="isActiveToggle" className="text-xs font-extrabold uppercase text-white tracking-wider cursor-pointer select-none">
                      Grant System Access (Is Active)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs border border-indigo-400/30 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
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
