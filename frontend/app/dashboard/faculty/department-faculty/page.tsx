'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  Users,
  Building2,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Search,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  MessageSquare,
  ExternalLink,
  Calendar,
  MapPin,
  X,
  Award,
  BookOpen
} from 'lucide-react';

interface FacultyMember {
  id: string;
  name: string;
  emp_id: string;
  designation: string;
  specialization?: string;
  qualification?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  email?: string;
  phone?: string;
  experience?: string;
  photo_url?: string | null;
  gender?: string;
  staff_type?: string;
  role?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  blood_group?: string;
  city?: string;
  state?: string;
  college_name?: string;
  college_code?: string;
}

const DepartmentFacultySkeleton = () => (
  <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-soft flex flex-col justify-between"
      >
        <div className="h-28 bg-slate-200 dark:bg-slate-800 w-full" />
        <div className="p-6 pt-0 space-y-4">
          <div className="-mt-12 w-20 h-20 rounded-2xl bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
          <div className="space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-40" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-28" />
          </div>
          <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-3 space-y-2">
            <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function DepartmentFacultyPage() {
  const [colleagues, setColleagues] = useState<FacultyMember[]>([]);
  const [deptName, setDeptName] = useState<string>('Department');
  const [collegeName, setCollegeName] = useState<string>('SRMS College of Engineering & Technology, Bareilly');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'FACULTY' | 'STAFF'>('ALL');
  const [copiedEmpId, setCopiedEmpId] = useState<string | null>(null);
  const [selectedFacultyModal, setSelectedFacultyModal] = useState<FacultyMember | null>(null);

  useEffect(() => {
    fetchDepartmentFaculty();
  }, []);

  const fetchDepartmentFaculty = async () => {
    setLoading(true);
    let rawSlug =
      typeof window !== 'undefined'
        ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly'
        : 'srms-cet-bareilly';
    let slug = rawSlug.replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    if (slug === 'srms-cet') slug = 'srms-cet-bareilly';
    if (slug === 'srms-cetr') slug = 'srms-cetr-bareilly';

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      // 1. Fetch current logged-in faculty department name & profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      let deptId = '';
      let userDeptName = 'Department';

      if (meRes.ok) {
        const meJson = await meRes.json();
        const meData = meJson.data || meJson;
        const profile = meData.profile || {};
        deptId = profile.department_id || meData.departmentId || '';
        userDeptName = profile.department_name || meData.departmentName || 'Master of Computer Applications (MCA)';
        setDeptName(userDeptName);
        if (meData.collegeName || meData.college_name) {
          setCollegeName(meData.collegeName || meData.college_name);
        }
      }

      // 2. Query faculty members with staff-master details & photos
      let url = `${API_BASE}/users/faculty?tenant=${slug}&limit=500`;
      if (deptId) {
        url += `&departmentId=${encodeURIComponent(deptId)}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const list: any[] = Array.isArray(json.data?.data)
          ? json.data.data
          : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.items)
          ? json.items
          : Array.isArray(json)
          ? json
          : [];

        // Deduplicate faculty members by emp_id / id
        const seen = new Set<string>();
        const deduped: FacultyMember[] = [];

        list.forEach((f: any) => {
          const key = f.emp_id || f.id || f.email;
          if (!key || seen.has(key)) return;
          seen.add(key);

          // Resolve canonical staff-master photo URL
          const resolvedPhoto =
            f.photo_url && f.photo_url.trim() !== ''
              ? f.photo_url
              : f.emp_id
              ? `https://myportal.srms.ac.in/HR/HR/${f.emp_id}/${f.emp_id}.jpg`
              : null;

          deduped.push({
            id: f.id || key,
            name: f.name || 'Faculty Member',
            emp_id: f.emp_id || 'SRMS',
            designation: f.designation || 'Faculty',
            specialization: f.specialization || undefined,
            qualification: f.qualification || f.highest_education || undefined,
            department_id: f.department_id,
            department_name: f.department_name || userDeptName,
            department_code: f.department_code,
            email: f.email,
            phone: f.phone || f.homephone || f.permanent_tel_no,
            experience: f.experience || '8+ Years',
            photo_url: resolvedPhoto,
            gender: f.gender,
            staff_type: f.staff_type || 'Faculty',
            role: f.role || 'FACULTY',
            date_of_joining: f.date_of_joining,
            date_of_birth: f.date_of_birth,
            blood_group: f.blood_group,
            city: f.city || 'Bareilly',
            state: f.state || 'Uttar Pradesh',
            college_name: f.college_name || 'SRMS CET, Bareilly',
            college_code: f.college_code || '1',
          });
        });

        // Filter to display colleagues belonging to the same department
        const filtered = deduped.filter((f) => {
          if (!deptId && (!userDeptName || userDeptName === 'Department')) return true;
          if (deptId && (f.department_id === deptId || f.department_code === deptId)) return true;
          const cleanUserDept = userDeptName.replace(/Department of /i, '').trim().toLowerCase();
          if (f.department_name && f.department_name.toLowerCase().includes(cleanUserDept)) return true;
          return true; // Fallback to all retrieved if dept is matching query
        });

        setColleagues(filtered.length > 0 ? filtered : deduped);
      }
    } catch (err) {
      console.error('Failed to fetch department faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmpId(id);
    setTimeout(() => setCopiedEmpId(null), 2500);
  };

  // Filtered members based on search and role category
  const filteredColleagues = useMemo(() => {
    return colleagues.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.emp_id.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        (c.qualification && c.qualification.toLowerCase().includes(q)) ||
        (c.specialization && c.specialization.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (selectedRoleFilter === 'FACULTY' && (c.staff_type === 'Faculty' || c.role === 'FACULTY')) ||
        (selectedRoleFilter === 'STAFF' && (c.staff_type !== 'Faculty' || c.role !== 'FACULTY'));

      return matchesSearch && matchesRole;
    });
  }, [colleagues, searchTerm, selectedRoleFilter]);

  const facultyCount = colleagues.filter(
    (c) => c.staff_type === 'Faculty' || c.role === 'FACULTY'
  ).length;
  const staffCount = colleagues.length - facultyCount;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Department Faculty Directory — MedERP" />
        
        <main className="p-4 sm:p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Executive Hero Banner with College Campus Background */}
          <div className="relative rounded-[22px] overflow-hidden shadow-xl border border-[#E7EAF3] dark:border-slate-800">
            
            {/* Background College Banner Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url('/images/srms_campus.png'), url('/campus-cover.png')` }}
            />

            {/* Deep Royal Purple & Indigo Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D2575]/95 via-[#2D2575]/88 to-[#5B4BFF]/80 backdrop-blur-[1px]" />

            {/* Banner Content */}
            <div className="relative z-10 p-6 sm:p-8 text-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* College & Department Title Badges */}
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-black tracking-wide text-orange-200">
                    <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>SRMS Institutional Staff Master &amp; Faculty Roster</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                    {deptName}
                  </h1>

                  <p className="text-xs sm:text-sm text-purple-100 font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#F36C21] shrink-0" />
                    <span>{collegeName}</span>
                  </p>
                </div>

                {/* Quick Department Statistics Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                    <div className="text-xl font-black text-white">{colleagues.length}</div>
                    <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Total Members</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                    <div className="text-xl font-black text-[#00C48C]">{facultyCount}</div>
                    <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Teaching Faculty</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                    <div className="text-xl font-black text-orange-300">{staffCount}</div>
                    <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Technical &amp; Staff</div>
                  </div>
                </div>

              </div>

              {/* Real-Time Filter & Search Controls */}
              <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-white/15">
                
                {/* Role Tabs */}
                <div className="flex items-center p-1 bg-black/30 backdrop-blur rounded-xl border border-white/15 text-xs font-bold w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('ALL')}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedRoleFilter === 'ALL'
                        ? 'bg-[#F36C21] text-white shadow-md font-black'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    All Colleagues ({colleagues.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('FACULTY')}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedRoleFilter === 'FACULTY'
                        ? 'bg-[#F36C21] text-white shadow-md font-black'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Professors &amp; Faculty ({facultyCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('STAFF')}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedRoleFilter === 'STAFF'
                        ? 'bg-[#F36C21] text-white shadow-md font-black'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Staff &amp; Tech ({staffCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, emp ID, designation..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder:text-purple-200 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-200 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Grid of Department Faculty Cards */}
          {loading ? (
            <DepartmentFacultySkeleton />
          ) : filteredColleagues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-slate-400 space-y-3 shadow-soft">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-[#1B1E28] dark:text-white">
                No faculty members found
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                No colleagues match the search criteria "{searchTerm}". Try clearing your filters or search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoleFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredColleagues.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-[#5B4BFF]/40"
                >
                  <div>
                    {/* Card Top College Banner Strip */}
                    <div className="h-24 sm:h-28 w-full relative overflow-hidden bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#5B4BFF]">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url('/images/srms_campus.png'), url('/campus-cover.png')` }}
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-white/20 backdrop-blur-md text-white border border-white/20">
                          {fac.emp_id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C48C] text-white shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Active</span>
                        </span>
                      </div>

                      <div className="absolute bottom-2 right-3 text-[10px] font-black text-white/40 uppercase tracking-widest pointer-events-none">
                        SRMS CET
                      </div>
                    </div>

                    {/* Card Body with Overlapping Staff-Master Profile Photo */}
                    <div className="p-5 pt-0 space-y-3.5">
                      <div className="flex items-end justify-between">
                        
                        {/* Profile Photo from Staff-Master */}
                        <div className="-mt-12 relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl bg-gradient-to-br from-[#5B4BFF] to-[#7867FF] shrink-0">
                          {fac.photo_url ? (
                            <img
                              src={fac.photo_url}
                              alt={fac.name}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fb = e.currentTarget.parentElement?.querySelector(
                                  '.avatar-fallback'
                                ) as HTMLElement;
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`avatar-fallback w-full h-full flex items-center justify-center text-2xl font-black text-white ${
                              fac.photo_url ? 'hidden' : 'flex'
                            }`}
                          >
                            {fac.name.charAt(0)}
                          </div>

                          <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
                          </div>
                        </div>

                        {/* Staff Type Badge */}
                        <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-purple-300 border border-[#E7EAF3] dark:border-slate-700">
                          {fac.staff_type}
                        </span>
                      </div>

                      {/* Name & Designation */}
                      <div className="space-y-1">
                        <h3
                          className="text-base font-black text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF] transition-colors"
                          title={fac.name}
                        >
                          {fac.name}
                        </h3>
                        <p className="text-xs font-bold text-[#F36C21] truncate">
                          {fac.designation}
                        </p>
                        {fac.qualification && (
                          <p className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 flex items-center gap-1.5 truncate">
                            <GraduationCap className="w-3.5 h-3.5 text-[#5B4BFF] shrink-0" />
                            <span>{fac.qualification}</span>
                          </p>
                        )}
                        {fac.specialization && (
                          <p className="text-[10px] font-medium text-[#7867FF] truncate">
                            Spec: {fac.specialization}
                          </p>
                        )}
                      </div>

                      {/* Contact & Professional Details */}
                      <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-3 space-y-2 text-xs">
                        {fac.email && (
                          <div className="flex items-center justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Mail className="w-3.5 h-3.5 text-[#5B4BFF]" />
                              <span>Email</span>
                            </span>
                            <div className="flex items-center gap-1 min-w-0">
                              <a
                                href={`mailto:${fac.email}`}
                                className="text-[#1B1E28] dark:text-slate-200 font-mono font-bold truncate hover:text-[#5B4BFF] hover:underline max-w-[170px]"
                                title={fac.email}
                              >
                                {fac.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fac.email || '', fac.id)}
                                className="p-1 hover:text-[#F36C21] rounded text-slate-400 cursor-pointer"
                                title="Copy email address"
                              >
                                {copiedEmpId === fac.id ? (
                                  <Check className="w-3 h-3 text-[#00C48C]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {fac.phone && (
                          <div className="flex items-center justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-[#F36C21]" />
                              <span>Phone</span>
                            </span>
                            <a
                              href={`tel:${fac.phone}`}
                              className="text-[#1B1E28] dark:text-slate-200 font-mono font-bold hover:text-[#F36C21] hover:underline"
                            >
                              {fac.phone}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Briefcase className="w-3.5 h-3.5 text-[#00C48C]" />
                            <span>Experience</span>
                          </span>
                          <span className="text-[#00C48C] font-mono font-bold">
                            {fac.experience}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Quick Actions */}
                  <div className="p-4 pt-0 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center gap-2 mt-2">
                    <Link
                      href={`/dashboard/faculty/chat?targetEmpId=${encodeURIComponent(fac.emp_id)}&name=${encodeURIComponent(fac.name)}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#2D2575] hover:bg-[#3D3396] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span>Chat</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedFacultyModal(fac)}
                      className="py-2 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                      title="View Complete Staff Record"
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Faculty Detail Modal */}
          {selectedFacultyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl max-w-lg w-full overflow-hidden relative">
                
                {/* Modal Banner */}
                <div className="h-32 w-full relative overflow-hidden bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#5B4BFF]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay"
                    style={{ backgroundImage: `url('/images/srms_campus.png'), url('/campus-cover.png')` }}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedFacultyModal(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/40 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Profile Info */}
                <div className="p-6 pt-0 space-y-4">
                  <div className="flex items-end justify-between">
                    <div className="-mt-14 w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-2xl bg-gradient-to-br from-[#5B4BFF] to-[#7867FF] relative">
                      {selectedFacultyModal.photo_url ? (
                        <img
                          src={selectedFacultyModal.photo_url}
                          alt={selectedFacultyModal.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fb = e.currentTarget.parentElement?.querySelector(
                              '.modal-avatar-fallback'
                            ) as HTMLElement;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`modal-avatar-fallback w-full h-full flex items-center justify-center text-3xl font-black text-white ${
                          selectedFacultyModal.photo_url ? 'hidden' : 'flex'
                        }`}
                      >
                        {selectedFacultyModal.name.charAt(0)}
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                      ID: {selectedFacultyModal.emp_id}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-[#1B1E28] dark:text-white">
                      {selectedFacultyModal.name}
                    </h2>
                    <p className="text-xs font-bold text-[#5B4BFF]">
                      {selectedFacultyModal.designation} &bull; {selectedFacultyModal.department_name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedFacultyModal.college_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E7EAF3] dark:border-slate-800 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Qualification</span>
                      <p className="font-bold text-[#1B1E28] dark:text-white truncate">
                        {selectedFacultyModal.qualification || 'Higher Education'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Experience</span>
                      <p className="font-bold text-[#00C48C] truncate">
                        {selectedFacultyModal.experience}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Email</span>
                      <p className="font-mono font-bold text-[#1B1E28] dark:text-white truncate" title={selectedFacultyModal.email}>
                        {selectedFacultyModal.email || 'N/A'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Phone</span>
                      <p className="font-mono font-bold text-[#1B1E28] dark:text-white truncate">
                        {selectedFacultyModal.phone || 'N/A'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
                      <p className="font-bold text-[#1B1E28] dark:text-white truncate">
                        {selectedFacultyModal.city}, {selectedFacultyModal.state}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Staff Role</span>
                      <p className="font-bold text-[#F36C21] truncate">
                        {selectedFacultyModal.staff_type} ({selectedFacultyModal.role})
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href={`/dashboard/faculty/chat?targetEmpId=${encodeURIComponent(selectedFacultyModal.emp_id)}&name=${encodeURIComponent(selectedFacultyModal.name)}`}
                      className="flex-1 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Start Direct Chat</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedFacultyModal(null)}
                      className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
