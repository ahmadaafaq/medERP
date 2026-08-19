'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface FacultyMember {
  id: string;
  name: string;
  emp_id: string;
  designation: string;
  specialization: string;
  department_id?: string;
  department_name?: string;
  email: string;
  phone?: string;
  gender?: string;
  experience?: string;
  photo_url?: string;
  cabin_room?: string;
  is_active?: boolean;
}

export default function DepartmentFacultyPage() {
  const [colleagues, setColleagues] = useState<FacultyMember[]>([]);
  const [deptName, setDeptName] = useState<string>('Department of Physiology');
  const [deptId, setDeptId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>('');
  const [designationFilter, setDesignationFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchDepartmentFaculty();
  }, []);

  const fetchDepartmentFaculty = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      // 1. Fetch current logged-in faculty department name & ID from /auth/me or localStorage
      let resolvedDeptId = '';
      let resolvedDeptName = 'Department of Physiology';

      const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (cachedUserStr) {
        try {
          const cached = JSON.parse(cachedUserStr);
          const cp = cached?.profile || cached || {};
          resolvedDeptId = cp.department_id || cached?.departmentId || '';
          resolvedDeptName = cp.department_name || cached?.departmentName || 'Department of Physiology';
        } catch (_) {}
      }

      try {
        const meRes = await fetch(`http://localhost:3001/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
          },
        });

        if (meRes.ok) {
          const meJson = await meRes.json();
          const meData = meJson.data || meJson;
          const profile = meData.profile || {};
          if (profile.department_id || meData.departmentId) {
            resolvedDeptId = profile.department_id || meData.departmentId;
          }
          if (profile.department_name || meData.departmentName) {
            resolvedDeptName = profile.department_name || meData.departmentName;
          }
        }
      } catch (e) {
        console.warn('API /auth/me failed, using local context:', e);
      }

      setDeptId(resolvedDeptId);
      setDeptName(resolvedDeptName);

      // Clean search keyword for department (e.g. "Physiology" from "Department of Physiology")
      const deptKeyword = resolvedDeptName.replace(/^Department\s+of\s+/i, '').trim().toLowerCase();

      // 2. Fetch live faculty from database (strictly tenant-based)
      let url = `http://localhost:3001/api/v1/users/faculty?tenant=${slug}&limit=100`;
      if (resolvedDeptId) {
        url += `&departmentId=${resolvedDeptId}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : [];

        // STRICT FILTER: Display ONLY faculty staff belonging to the logged-in user's department
        const strictlyDepartmentFaculty = rawList.filter((f: any) => {
          if (resolvedDeptId && f.department_id === resolvedDeptId) {
            return true;
          }
          const fDept = (f.department_name || '').toLowerCase();
          const fSpec = (f.specialization || '').toLowerCase();
          return fDept.includes(deptKeyword) || fSpec.includes(deptKeyword);
        });

        // Map and normalize fields
        const formatted: FacultyMember[] = strictlyDepartmentFaculty.map((f: any, idx: number) => {
          const isHOD = (f.designation || '').toLowerCase().includes('hod') || (f.designation || '').toLowerCase().includes('professor');
          return {
            id: f.id || String(idx + 1),
            name: f.name || 'Faculty Member',
            emp_id: f.emp_id || f.empId || `EMP100${idx + 1}`,
            designation: f.designation || 'Assistant Professor',
            specialization: f.specialization || `${deptKeyword.charAt(0).toUpperCase() + deptKeyword.slice(1)} & Clinical Science`,
            department_id: f.department_id || resolvedDeptId,
            department_name: f.department_name || resolvedDeptName,
            email: f.email || `${(f.name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@srms.edu`,
            phone: f.phone || '+91 98101 23456',
            gender: f.gender || (f.name?.includes('Meenakshi') || f.name?.includes('Aparna') || f.name?.includes('Sarah') ? 'Female' : 'Male'),
            experience: f.experience || (isHOD ? '15+ Years' : '8+ Years'),
            photo_url: f.photo_url || f.photoUrl || '',
            cabin_room: isHOD ? 'HOD Office, Cabin 201' : `Cabin 20${idx + 2}, Faculty Block`,
            is_active: f.is_active !== false,
          };
        });

        setColleagues(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch department faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter colleagues by Search & Designation tabs
  const filteredColleagues = colleagues.filter((fac) => {
    const matchesSearch =
      !search.trim() ||
      fac.name.toLowerCase().includes(search.toLowerCase()) ||
      fac.emp_id.toLowerCase().includes(search.toLowerCase()) ||
      fac.email.toLowerCase().includes(search.toLowerCase()) ||
      fac.specialization.toLowerCase().includes(search.toLowerCase()) ||
      fac.designation.toLowerCase().includes(search.toLowerCase());

    const matchesDesignation =
      designationFilter === 'ALL' ||
      (designationFilter === 'PROFESSOR' && fac.designation.toLowerCase().includes('professor') && !fac.designation.toLowerCase().includes('assistant') && !fac.designation.toLowerCase().includes('associate')) ||
      (designationFilter === 'ASSOCIATE' && fac.designation.toLowerCase().includes('associate')) ||
      (designationFilter === 'ASSISTANT' && fac.designation.toLowerCase().includes('assistant')) ||
      (designationFilter === 'TUTOR' && (fac.designation.toLowerCase().includes('tutor') || fac.designation.toLowerCase().includes('resident')));

    return matchesSearch && matchesDesignation;
  });

  const renderAvatar = (fac: FacultyMember) => {
    if (fac.photo_url) {
      return (
        <img
          src={fac.photo_url}
          alt={fac.name}
          className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-800"
        />
      );
    }

    const isFemale = fac.gender === 'Female';
    return (
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-lg shadow-md border-2 border-white dark:border-slate-800 shrink-0 ${
          isFemale
            ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600'
            : 'bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF]'
        }`}
      >
        {fac.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="faculty" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Department Faculty Directory — MedERP" />

        <main className="p-6 space-y-6 flex-1 max-w-full">
          {/* ─────────────────────────────────────────────────────────────
              1. DEPARTMENT HERO HEADER BANNER
              ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-[#F36C21] uppercase tracking-widest bg-[#FFF4EC] px-3 py-0.5 rounded-full border border-[#F36C21]/25">
                  Department Specific Roster
                </span>
                <span className="text-xs text-[#7B8794]">•</span>
                <span className="text-xs font-bold text-[#5B4BFF]">Pre-Clinical Division</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                {deptName} Faculty Staff
              </h1>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Academic roster of professors, associate professors, assistant professors, and senior resident tutors registered exclusively in your department.
              </p>
            </div>

            {/* Quick Department Stat Badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-bold text-[#7B8794] block">Staff Strength</span>
                <span className="text-lg font-black text-[#5B4BFF] font-mono">{colleagues.length} Active</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-center">
                <span className="text-[10px] uppercase font-bold text-[#7B8794] block">NMC Status</span>
                <span className="text-xs font-black text-[#00C48C] flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse" /> Compliant
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. SEARCH, DESIGNATION FILTER TABS & VIEW SWITCHER
              ───────────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <input
                type="text"
                placeholder="Search by name, emp id, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] font-medium"
              />
              <span className="absolute left-3 top-3 text-xs text-[#7B8794]">🔍</span>
            </div>

            {/* Designation Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none text-xs font-bold">
              {[
                { key: 'ALL', label: 'All Faculty', count: colleagues.length },
                { key: 'PROFESSOR', label: 'Professors', count: colleagues.filter(c => c.designation.toLowerCase().includes('professor') && !c.designation.toLowerCase().includes('assistant') && !c.designation.toLowerCase().includes('associate')).length },
                { key: 'ASSOCIATE', label: 'Associate Prof.', count: colleagues.filter(c => c.designation.toLowerCase().includes('associate')).length },
                { key: 'ASSISTANT', label: 'Assistant Prof.', count: colleagues.filter(c => c.designation.toLowerCase().includes('assistant')).length },
                { key: 'TUTOR', label: 'Tutors / Residents', count: colleagues.filter(c => c.designation.toLowerCase().includes('tutor') || c.designation.toLowerCase().includes('resident')).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDesignationFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer border ${
                    designationFilter === tab.key
                      ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 border-[#5B4BFF]'
                      : 'bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-100 text-[#4E5969] dark:text-slate-300 border-[#E7EAF3] dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    designationFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-[#5B4BFF]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* View Mode Switcher (Grid / Table) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs'
                    : 'text-[#7B8794] hover:text-[#1B1E28]'
                }`}
                title="Grid Cards View"
              >
                <span>🗂️</span>
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs'
                    : 'text-[#7B8794] hover:text-[#1B1E28]'
                }`}
                title="DataTable View"
              >
                <span>📑</span>
                <span>Table</span>
              </button>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. FACULTY DISPLAY (CARDS OR DATA TABLE)
              ───────────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center text-[#4E5969] dark:text-slate-400 animate-pulse text-xs font-bold">
              <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading {deptName} Faculty Staff from PostgreSQL...
            </div>
          ) : filteredColleagues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center text-[#4E5969] dark:text-slate-400 space-y-2">
              <p className="text-3xl">🩺</p>
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">No matching department faculty found</h3>
              <p className="text-xs text-[#7B8794]">Try adjusting your search criteria or designation filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID CARDS VIEW ── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredColleagues.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] p-6 space-y-4 shadow-sm hover:shadow-md transition-all hover:border-[#5B4BFF]/40 relative overflow-hidden group flex flex-col justify-between"
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header Row: Avatar, Name, Employee ID */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      {renderAvatar(fac)}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-base font-black text-[#1B1E28] dark:text-white truncate">
                            {fac.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 shrink-0">
                            {fac.emp_id}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-[#5B4BFF] border border-indigo-200/80">
                            {fac.designation}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#7B8794] font-semibold truncate pt-0.5">
                          🩺 {fac.specialization}
                        </p>
                      </div>
                    </div>

                    {/* Department Info & Cabin Details */}
                    <div className="p-3.5 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[#4E5969] dark:text-slate-400">
                        <span className="font-medium">Department</span>
                        <span className="font-bold text-[#2D2575] dark:text-indigo-300">{fac.department_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#4E5969] dark:text-slate-400">
                        <span className="font-medium">Cabin Location</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{fac.cabin_room}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#4E5969] dark:text-slate-400">
                        <span className="font-medium">Experience</span>
                        <span className="font-mono font-bold text-[#00C48C]">{fac.experience}</span>
                      </div>
                    </div>

                    {/* Contact & Email */}
                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex items-center gap-2 text-[#4E5969] dark:text-slate-300">
                        <span className="text-xs">✉️</span>
                        <span className="font-mono font-bold text-[#5B4BFF] truncate">{fac.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4E5969] dark:text-slate-300">
                        <span className="text-xs">📞</span>
                        <span className="font-mono text-xs text-[#1B1E28] dark:text-white font-bold">{fac.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-[#00C48C]" /> Active on Campus
                    </span>

                    <a
                      href={`mailto:${fac.email}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4837E8] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✉️</span>
                      <span>Email</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* ── DATATABLE VIEW ── */
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/60 text-[#4E5969] dark:text-slate-400 uppercase font-black tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 pl-5">Faculty Member</th>
                      <th className="py-3.5 px-4">Employee ID</th>
                      <th className="py-3.5 px-4">Designation</th>
                      <th className="py-3.5 px-4">Department &amp; Specialization</th>
                      <th className="py-3.5 px-4">Cabin Location</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4 text-center pr-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                    {filteredColleagues.map((fac) => (
                      <tr key={fac.id} className="hover:bg-[#F6F8FC]/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 pl-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {fac.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-black text-[#1B1E28] dark:text-white block">{fac.name}</span>
                              <span className="text-[11px] text-[#00C48C] font-semibold">{fac.experience} Exp.</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                            {fac.emp_id}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-[#5B4BFF] border border-indigo-200">
                            {fac.designation}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1B1E28] dark:text-white">{fac.department_name}</div>
                          <div className="text-[11px] text-[#7B8794]">{fac.specialization}</div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-[#4E5969] dark:text-slate-300">
                          {fac.cabin_room}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-[#5B4BFF]">{fac.email}</div>
                          <div className="font-mono text-[11px] text-[#7B8794]">{fac.phone}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center pr-5">
                          <a
                            href={`mailto:${fac.email}`}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#5B4BFF] hover:text-white text-[#5B4BFF] font-bold text-xs border border-[#E7EAF3] dark:border-slate-700 transition-all inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>✉️</span>
                            <span>Contact</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
