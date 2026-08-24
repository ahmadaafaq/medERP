'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface College {
  id: string;
  code: string;
  name: string;
  slug: string;
  colg_cd?: string;
}

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone?: string;
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
  qualification?: string;
  specialization?: string;
  role?: string;
  usr_id?: string;
  devicecd?: string | number;
  device_cd?: string | number;
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

const SRMS_LOCATIONS = [
  { locid: '7', label: '[Loc 7] SRMS CET, Bareilly (Engineering & Tech)', slug: 'srms-cet-bareilly' },
  { locid: '8', label: '[Loc 8] SRMS CETR, Bareilly (Research Institute)', slug: 'srms-cetr-bareilly' },
  { locid: '1', label: '[Loc 1] SRMS IMS, Bareilly (Medical Institute)', slug: 'srms-ims' },
  { locid: '3', label: '[Loc 3] SRMS CET, Unnao Campus', slug: 'srms-cet-unnao' },
  { locid: '4', label: '[Loc 4] SRMS IBS, Lucknow (Business School)', slug: 'srms-ibs-lucknow' },
  { locid: '12', label: '[Loc 12] SRMS College of Pharmacy', slug: 'srms-pharmacy' },
  { locid: '15', label: '[Loc 15] SRMS College of Law', slug: 'srms-college-of-law' },
  { locid: '18', label: '[Loc 18] SRMS Nursing College, Bareilly', slug: 'srms-nursing-college' },
  { locid: 'all', label: '🌐 All SRMS Firm Locations & Institutions', slug: 'all' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function StaffAdminPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all_staff' | 'current_admins'>('all_staff');

  // User auth state
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');

  // Sync state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncLocId, setSyncLocId] = useState('7');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  // Direct create admin modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    empId: '',
    password: '',
    phone: '',
    designation: 'College Administrator',
    college_slug: 'srms-cet-bareilly',
  });
  const [creating, setCreating] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Initial Metadata Fetch (Colleges, Departments)
  const fetchMetadata = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      let role = 'ADMIN';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      if (typeof window !== 'undefined') {
        role = (localStorage.getItem('role') || localStorage.getItem('auth_role') || 'ADMIN').toUpperCase();
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

      const [colRes, deptRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
      ]);

      if (colRes && colRes.ok) {
        const colJson = await colRes.json();
        const colList = colJson.data || colJson;
        if (Array.isArray(colList)) {
          setColleges(colList);
        }
      }

      if (deptRes && deptRes.ok) {
        const deptJson = await deptRes.json();
        const deptList = deptJson.data || deptJson;
        if (Array.isArray(deptList)) {
          setDepartments(deptList);
        }
      }
    } catch (err) {
      console.error('[StaffAdmin] Metadata fetch error:', err);
    }
  };

  // 2. Fetch Faculties exactly as Staff Master does
  const fetchFaculties = async (colFilter: string = selectedCollegeFilter) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || localStorage.getItem('auth_role') || 'ADMIN').toUpperCase() : 'ADMIN';
      const userSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

      let querySlug = userSlug;
      if (role === 'SUPER_ADMIN') {
        const targetCollege = colleges.find(c => String(c.code) === String(colFilter) || String(c.id) === String(colFilter) || c.slug === colFilter);
        querySlug = colFilter === 'all' ? 'all' : (targetCollege?.slug || colFilter || 'srms-cet-bareilly');
      }

      const res = await fetch(`${API_BASE}/users/faculty?tenant=${querySlug}&limit=1000`, { headers });
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
      }
    } catch (err) {
      console.error('[StaffAdmin] Failed to fetch staff list:', err);
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

  // Execute Live Sync with SRMS HR API
  const handleExecuteSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`${API_BASE}/college-master/employees/sync-external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ locid: syncLocId }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const items = Array.isArray(json.data) ? json.data : [];
        setSyncResult({
          success: true,
          count: items.length || json.count || 0,
          message: `Successfully synchronized ${items.length || json.count || 0} employee records from live SRMS HR API!`,
        });
        showToast('success', `✓ Synchronized ${items.length || json.count || 0} employees from SRMS HR API!`);
        fetchFaculties(selectedCollegeFilter);
      } else {
        setSyncResult({
          success: false,
          count: 0,
          message: json.message || 'HR sync completed with warnings.',
        });
        showToast('error', json.message || 'HR sync failed');
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        count: 0,
        message: err.message || 'Network error during HR synchronization.',
      });
      showToast('error', 'Network error during HR synchronization');
    } finally {
      setSyncing(false);
    }
  };

  // 1-Click Promote Staff to Administrator
  const handleMakeAdmin = async (staff: Faculty) => {
    const confirmPrompt = `Are you sure you want to promote ${staff.name} (${staff.emp_id}) to full College Administrator?`;
    if (!confirm(confirmPrompt)) return;

    try {
      const targetSlug = staff.college_slug || userTenantSlug || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`${API_BASE}/users/staff/${staff.id}/grant-admin?tenant=${targetSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: 'COLLEGE_ADMIN' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to grant admin rights');

      showToast('success', `🛡️ Full Administrator Rights successfully granted to ${staff.name}!`);
      fetchFaculties(selectedCollegeFilter);
    } catch (err: any) {
      showToast('error', err.message || 'Could not grant admin rights');
    }
  };

  // 1-Click Revoke Admin Rights and Revert to Default Faculty
  const handleRevokeAdmin = async (staff: Faculty) => {
    const confirmPrompt = `Are you sure you want to remove Administrator rights from ${staff.name} (${staff.emp_id}) and revert back to default Faculty?`;
    if (!confirm(confirmPrompt)) return;

    try {
      const targetSlug = staff.college_slug || userTenantSlug || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`${API_BASE}/users/staff/${staff.id}/revoke-admin?tenant=${targetSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to remove admin rights');

      showToast('success', `✓ Administrator rights removed from ${staff.name}. Reverted to Faculty.`);
      fetchFaculties(selectedCollegeFilter);
    } catch (err: any) {
      showToast('error', err.message || 'Could not remove admin rights');
    }
  };

  // Direct create new Admin user
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      showToast('error', 'Please fill name, email, and password');
      return;
    }

    setCreating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const slug = newAdminData.college_slug || userTenantSlug || 'srms-cet-bareilly';
      const res = await fetch(`${API_BASE}/users/faculty?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...newAdminData,
          staffType: 'Administrator',
          role: 'COLLEGE_ADMIN',
          isActive: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create administrator');

      showToast('success', `✓ Administrator account created for ${newAdminData.name}!`);
      setIsCreateModalOpen(false);
      setNewAdminData({
        name: '',
        email: '',
        empId: '',
        password: '',
        phone: '',
        designation: 'College Administrator',
        college_slug: userTenantSlug,
      });
      fetchFaculties(selectedCollegeFilter);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create administrator account');
    } finally {
      setCreating(false);
    }
  };

  // Filter faculties locally
  const filteredFaculties = useMemo(() => {
    return faculties.filter((fac: Faculty) => {
      // 1. College filter
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

      // 2. Tab filter
      const isAdmin =
        fac.role === 'COLLEGE_ADMIN' ||
        fac.role === 'SUPER_ADMIN' ||
        fac.role === 'ADMIN' ||
        (fac.designation && fac.designation.toLowerCase().includes('admin'));

      if (activeTab === 'current_admins' && !isAdmin) return false;

      // 3. Department filter
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

      // 4. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          fac.name?.toLowerCase().includes(term) ||
          fac.emp_id?.toLowerCase().includes(term) ||
          fac.email?.toLowerCase().includes(term) ||
          fac.phone?.toLowerCase().includes(term) ||
          (fac.designation && fac.designation.toLowerCase().includes(term)) ||
          (fac.department_name && fac.department_name.toLowerCase().includes(term)) ||
          (fac.subject_name && fac.subject_name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [faculties, selectedCollegeFilter, activeTab, selectedDeptFilter, searchTerm, colleges, departments]);

  const currentAdminsCount = useMemo(() => {
    return faculties.filter(
      (f) =>
        f.role === 'COLLEGE_ADMIN' ||
        f.role === 'SUPER_ADMIN' ||
        f.role === 'ADMIN' ||
        (f.designation && f.designation.toLowerCase().includes('admin'))
    ).length;
  }, [faculties]);

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Make Staff as Admin" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                  : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
              }`}
            >
              <span className="text-lg">{toast.type === 'success' ? '🛡️' : '⚠️'}</span>
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          )}

          {/* Top Title Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-[#E7EAF3] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                    Make Staff as Administrator
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Delegation Control
                  </span>
                </div>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">
                  Elevate any teaching or non-teaching employee to full College Administrator privileges with 1-click execution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Sync from SRMS HR Button */}
              <button
                onClick={() => { setIsSyncModalOpen(true); setSyncResult(null); }}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF8C42] hover:from-[#E05C12] hover:to-[#F36C21] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                title="Synchronize employee records from live SRMS HR API"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>Sync from SRMS HR</span>
              </button>

              {/* Direct Admin Creation */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#5B4BFF]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Direct Admin</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Staff Roster</p>
                <h3 className="text-2xl font-black text-[#1B1E28] dark:text-white mt-1">{faculties.length}</h3>
                <span className="text-[10px] text-slate-500">Across all departments</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] flex items-center justify-center text-xl font-bold">
                👥
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active College Admins</p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{currentAdminsCount}</h3>
                <span className="text-[10px] text-slate-500">With full portal rights</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center text-xl font-bold">
                🛡️
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Institution</p>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[180px]">
                  {colleges.find(c => String(c.code) === String(selectedCollegeFilter) || c.slug === selectedCollegeFilter || c.id === selectedCollegeFilter)?.name || 'SRMS CET, Bareilly'}
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold">● Isolated Schema Active</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center text-xl font-bold">
                🏛️
              </div>
            </div>
          </div>

          {/* Filters & Tabs Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-[#E7EAF3] dark:border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start">
                <button
                  onClick={() => setActiveTab('all_staff')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'all_staff'
                      ? 'bg-white dark:bg-slate-900 text-[#5B4BFF] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Staff Members ({faculties.length})
                </button>
                <button
                  onClick={() => setActiveTab('current_admins')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'current_admins'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>🛡️ Current Admins</span>
                  <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] rounded-full">
                    {currentAdminsCount}
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff by name, EmpID, phone, or designation..."
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
              {/* College Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => {
                    setSelectedCollegeFilter(e.target.value);
                    setSelectedDeptFilter('all');
                  }}
                  className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm cursor-pointer"
                >
                  <option value="all">🏛️ All Colleges ({colleges.length})</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.code || col.slug || col.id}>
                      🏛️ [#{col.code || col.id}] {col.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full h-11 px-3.5 pr-8 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white shadow-sm cursor-pointer"
                >
                  <option value="all">🏢 All Departments ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Staff & Admin Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] shadow-sm border border-[#E7EAF3] dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">
                  {activeTab === 'all_staff' ? 'Staff Directory & Delegation' : 'Active College Administrators'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredFaculties.length} employee records
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50/80 dark:bg-slate-800/60">
                    <th className="pl-6 py-4">Employee</th>
                    <th className="py-4">Emp ID / Usr ID</th>
                    <th className="py-4">College</th>
                    <th className="py-4">Department & Subject</th>
                    <th className="py-4">Designation</th>
                    <th className="py-4">Current Role</th>
                    <th className="pr-6 py-4 text-right">Admin Delegation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                  {loading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse bg-slate-50/50 dark:bg-slate-900/20">
                        <td className="pl-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="pr-6 py-4 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredFaculties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400 font-medium">
                        No staff records found for this institution. Click &quot;Sync from SRMS HR&quot; to import live records.
                      </td>
                    </tr>
                  ) : (
                    filteredFaculties.map((fac) => {
                      const matchedCol = colleges.find(c => c.id === fac.college_id || c.code === fac.college_code || c.slug === fac.college_slug);
                      const displayColName = matchedCol?.name || fac.college_name || 'SRMS CET';

                      const isAdmin =
                        fac.role === 'COLLEGE_ADMIN' ||
                        fac.role === 'SUPER_ADMIN' ||
                        fac.role === 'ADMIN' ||
                        (fac.designation && fac.designation.toLowerCase().includes('admin'));

                      return (
                        <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
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
                                    {fac.name
                                      ? fac.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                      : 'ST'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white">{fac.name}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{fac.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {fac.emp_id || 'N/A'}
                            </span>
                            {fac.usr_id && (
                              <span className="block text-[10px] text-indigo-500 font-semibold font-mono">
                                UID: {fac.usr_id}
                              </span>
                            )}
                          </td>

                          <td className="py-4 font-medium text-slate-600 dark:text-slate-300">
                            {displayColName}
                          </td>

                          <td className="py-4">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px] inline-block truncate max-w-[160px]">
                                🏢 {fac.department_name || 'General'}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {fac.subject_name ? `📚 ${fac.subject_name}` : (fac.qualification ? `🎓 ${fac.qualification}` : '')}
                              </p>
                            </div>
                          </td>

                          <td className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {fac.designation || 'Faculty Member'}
                          </td>

                          <td className="py-4">
                            {isAdmin ? (
                              <span className="px-2.5 py-1 rounded-full font-black uppercase text-[10px] tracking-wide inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                🛡️ Admin Rights
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] tracking-wide inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {fac.staff_type || 'Faculty'}
                              </span>
                            )}
                          </td>

                          <td className="pr-6 py-4 text-right">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-2.5">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                  <span>Active Admin</span>
                                </span>
                                <button
                                  onClick={() => handleRevokeAdmin(fac)}
                                  className="h-8 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.97]"
                                  title={`Remove Administrator Rights from ${fac.name} and revert to default Faculty`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Remove from Admin</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMakeAdmin(fac)}
                                className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer ml-auto"
                                title={`Grant Administrator Rights to ${fac.name}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                <span>Make Admin</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Sync from SRMS HR Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] shadow-2xl border border-[#E7EAF3] dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                  🔄
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B1E28] dark:text-white">
                    Synchronize Staff from Live SRMS HR
                  </h3>
                  <p className="text-xs text-slate-400">
                    Imports employee records from live SRMS HR API into this college schema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select SRMS Location / Institution
                </label>
                <select
                  value={syncLocId}
                  onChange={(e) => setSyncLocId(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white cursor-pointer"
                >
                  {SRMS_LOCATIONS.map((loc) => (
                    <option key={loc.locid} value={loc.locid}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {syncResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-medium ${
                    syncResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {syncResult.message}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E7EAF3] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleExecuteSync}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF8C42] hover:from-[#E05C12] hover:to-[#F36C21] text-white text-xs font-extrabold shadow-md shadow-orange-500/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing ? 'Synchronizing...' : 'Start Live HR Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Create Admin */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] shadow-2xl border border-[#E7EAF3] dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B1E28] dark:text-white">
                    Create Direct College Administrator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provisions a new user with full COLLEGE_ADMIN privileges
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email ID *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminData.email}
                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    placeholder="admin@srms.ac.in"
                    className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={newAdminData.empId}
                    onChange={(e) => setNewAdminData({ ...newAdminData, empId: e.target.value })}
                    placeholder="e.g. EMP8001"
                    className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newAdminData.password}
                    onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={newAdminData.phone}
                    onChange={(e) => setNewAdminData({ ...newAdminData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign College Institution
                </label>
                <select
                  value={newAdminData.college_slug}
                  onChange={(e) => setNewAdminData({ ...newAdminData, college_slug: e.target.value })}
                  className="w-full h-10 px-3 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white cursor-pointer"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.slug || col.code || col.id}>
                      🏛️ {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E7EAF3] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white text-xs font-extrabold shadow-md shadow-[#5B4BFF]/25 cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating Admin...' : 'Create & Assign Rights'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
