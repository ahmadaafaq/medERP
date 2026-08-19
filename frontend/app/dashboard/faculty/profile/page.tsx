'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface FacultyProfile {
  id?: string;
  name?: string;
  emp_id?: string;
  photo_url?: string;
  cover_url?: string;
  designation?: string;
  specialization?: string;
  department_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  qualification?: string;
  experience?: string;
  joining_date?: string;
  nmc_reg_no?: string;
  cabin_room?: string;
  intercom_ext?: string;
  blood_group?: string;
  office_hours?: string;
}

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'academic' | 'contact' | 'schedule' | 'research'>('academic');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<FacultyProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const meData = json.data || json;
        const p = meData.profile || meData;
        const name = p.name || meData.name || 'Dr. Sanjay Singh';
        const emp_id = p.emp_id || p.empId || meData.empId || 'EMP1001';
        const photo_url = p.photo_url || p.photoUrl || meData.photo_url || meData.photoUrl || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : name.includes('Aparna') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png');
        const designation = p.designation || meData.designation || 'Professor & HOD';
        const specialization = p.specialization || meData.specialization || 'Physiology & Biophysics';
        const department_name = p.department_name || meData.departmentName || 'Department of Physiology';
        const email = meData.email || p.email || 'sanjay.singh@srms.edu';

        const data: FacultyProfile = {
          id: p.id || meData.id || '1',
          name,
          emp_id,
          photo_url,
          cover_url: '/campus_cover.png',
          designation,
          specialization,
          department_name,
          email,
          phone: p.phone || meData.phone || '+91 98765 43210',
          gender: p.gender || meData.gender || 'Male',
          qualification: p.qualification || meData.qualification || 'MD (Physiology), MBBS',
          experience: p.experience || meData.experience || '8 Years',
          joining_date: p.joining_date || meData.joining_date || '2018-07-15',
          nmc_reg_no: p.nmc_reg_no || 'NMC-UP-78421/2014',
          cabin_room: 'Cabin 204, Phase I Academic Block',
          intercom_ext: 'Ext. 402',
          blood_group: 'B+ Positive',
          office_hours: 'Mon – Fri: 02:00 PM – 04:30 PM',
        };
        setProfile(data);
        setEditFormData(data);
      } else {
        fallbackCachedProfile();
      }
    } catch (err) {
      console.warn('Failed to fetch profile from API, falling back to local storage:', err);
      fallbackCachedProfile();
    } finally {
      setLoading(false);
    }
  };

  const fallbackCachedProfile = () => {
    const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let cached: any = null;
    try { cached = cachedUserStr ? JSON.parse(cachedUserStr) : null; } catch {}
    let cp = cached?.profile || cached || {};
    const name = cp.name || cached?.name || 'Dr. Sanjay Singh';

    const data: FacultyProfile = {
      id: cp.id || '1',
      name,
      emp_id: cp.emp_id || cp.empId || cached?.empId || 'EMP1001',
      photo_url: cp.photo_url || cp.photoUrl || cached?.photo_url || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png'),
      cover_url: '/campus_cover.png',
      designation: cp.designation || cached?.designation || 'Professor & HOD',
      specialization: cp.specialization || cached?.specialization || 'Physiology & Biophysics',
      department_name: cp.department_name || cached?.departmentName || 'Department of Physiology',
      email: cached?.email || cp.email || 'sanjay.singh@srms.edu',
      phone: cp.phone || '+91 98765 43210',
      gender: cp.gender || 'Male',
      qualification: cp.qualification || 'MD (Physiology), MBBS',
      experience: cp.experience || '8 Years',
      joining_date: cp.joining_date || '2018-07-15',
      nmc_reg_no: 'NMC-UP-78421/2014',
      cabin_room: 'Cabin 204, Phase I Academic Block',
      intercom_ext: 'Ext. 402',
      blood_group: 'B+ Positive',
      office_hours: 'Mon – Fri: 02:00 PM – 04:30 PM',
    };
    setProfile(data);
    setEditFormData(data);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = { ...profile, ...editFormData };
    setProfile(updated);
    try {
      const cachedStr = localStorage.getItem('user');
      if (cachedStr) {
        const u = JSON.parse(cachedStr);
        if (u.profile) {
          u.profile = { ...u.profile, ...editFormData };
        } else {
          u.name = editFormData.name || u.name;
        }
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch (_) {}
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="faculty" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Profile & Dossier — MedERP" />

        <main className="p-6 space-y-6 flex-1 w-full max-w-full">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading Complete Faculty Dossier...
            </div>
          ) : (
            <div className="space-y-6">
              {/* ─────────────────────────────────────────────────────────────
                  1. FULL-WIDTH HERO COVER BANNER & PROFILE CARD
                  ───────────────────────────────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 rounded-[26px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden relative">
                
                {/* Cover Image Container */}
                <div className="h-56 sm:h-72 w-full relative overflow-hidden bg-[#2D2575]">
                  <img
                    src={profile?.cover_url || '/campus_cover.png'}
                    alt="Campus Cover"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle Gradient Overlays for High-Contrast Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2D2575]/75 via-transparent to-[#2D2575]/40 pointer-events-none" />

                  {/* Top Campus Institutional Tag */}
                  <div className="absolute top-4 left-5 sm:left-7 flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg">
                      <span className="text-sm">🏛️</span>
                      <span>Rajshree Institute of Medical Sciences</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">NMC Recognized</span>
                    </div>
                  </div>

                  {/* ECG Heartbeat Line Overlay */}
                  <div className="absolute top-4 right-6 opacity-30 pointer-events-none hidden md:block">
                    <svg width="140" height="35" viewBox="0 0 140 40" fill="none">
                      <path
                        d="M0 20 H30 L35 10 L42 32 L48 5 L55 28 L60 20 H140"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Overlapping Profile Info Bar */}
                <div className="px-6 sm:px-8 pb-7 pt-0 relative">
                  <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-5 -mt-16 sm:-mt-20">
                    
                    {/* Avatar + Primary Details */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                      {/* Avatar with Verified Ring & Online Status */}
                      <div className="relative group shrink-0">
                        {profile?.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.name || 'Doctor'}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 border-2 border-[#5B4BFF] bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-slate-900 border-2 border-[#5B4BFF]">
                            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
                          </div>
                        )}
                        {/* Verified NMC Medical Seal Badge */}
                        <div
                          className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#00C48C] text-white flex items-center justify-center text-xs font-black shadow-lg border-2 border-white dark:border-slate-900"
                          title="Verified Medical Practitioner & NMC Faculty"
                        >
                          ✓
                        </div>
                      </div>

                      {/* Doctor Name, Designation, Department */}
                      <div className="space-y-1.5 pb-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                          <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                            {profile?.name}
                          </h1>
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 shadow-xs">
                            {profile?.emp_id}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Active Faculty
                          </span>
                        </div>

                        <p className="text-sm font-bold text-[#4E5969] dark:text-slate-300 flex items-center justify-center md:justify-start gap-2">
                          <span>🩺</span>
                          <span>{profile?.designation}</span>
                          <span>•</span>
                          <span className="text-[#5B4BFF] font-black">{profile?.department_name}</span>
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#7B8794] pt-0.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>🏛️</span> {profile?.cabin_room}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>📜</span> Reg: {profile?.nmc_reg_no}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F6F8FC] dark:hover:bg-slate-700 text-[#1B1E28] dark:text-white border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>✏️</span>
                        <span>{isEditing ? 'Close Editor' : 'Edit Profile'}</span>
                      </button>

                      <a
                        href="#schedule-section"
                        onClick={() => setActiveSection('schedule')}
                        className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4837E8] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>📅</span>
                        <span>Weekly Roster</span>
                      </a>
                    </div>

                  </div>
                </div>

              </div>

              {/* ─────────────────────────────────────────────────────────────
                  2. KEY MEDICAL METRICS COUNTER BAR (4 Stat Cards)
                  ───────────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] flex items-center justify-center text-2xl shrink-0">
                    🎓
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B8794] block">
                      Assigned Batches
                    </span>
                    <h3 className="text-xl font-black text-[#1B1E28] dark:text-white mt-0.5">
                      2 Active Batches
                    </h3>
                    <p className="text-[11px] text-[#5B4BFF] font-semibold">2023 & 2024 MBBS</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00C48C] flex items-center justify-center text-2xl shrink-0">
                    ⏱️
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B8794] block">
                      Teaching Hours YTD
                    </span>
                    <h3 className="text-xl font-black text-[#1B1E28] dark:text-white mt-0.5">
                      142 / 160 Hrs
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold">88.7% Delivered</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] flex items-center justify-center text-2xl shrink-0">
                    📋
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B8794] block">
                      Logbook Audits
                    </span>
                    <h3 className="text-xl font-black text-[#1B1E28] dark:text-white mt-0.5">
                      340 Verified
                    </h3>
                    <p className="text-[11px] text-[#F36C21] font-semibold">18 Pending Signoff</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-2xl shrink-0">
                    📑
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7B8794] block">
                      Research & Papers
                    </span>
                    <h3 className="text-xl font-black text-[#1B1E28] dark:text-white mt-0.5">
                      14 Indexed
                    </h3>
                    <p className="text-[11px] text-purple-600 font-semibold">PubMed & Scopus</p>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  3. EDIT PROFILE POPUP / INLINE CARD (WHEN ACTIVE)
                  ───────────────────────────────────────────────────────────── */}
              {isEditing && (
                <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#5B4BFF]/40 shadow-xl p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✏️</span>
                      <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                        Edit Faculty Profile & Contact Information
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-[#7B8794] hover:text-[#1B1E28] font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Full Name & Salutation *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Academic Designation *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.designation || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Department Name *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.department_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, department_name: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={editFormData.email || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.phone || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1B1E28] dark:text-white mb-1">Cabin Room / Block</label>
                        <input
                          type="text"
                          value={editFormData.cabin_room || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, cabin_room: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl border border-[#E7EAF3] text-xs font-bold text-[#4E5969] hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4837E8] text-white text-xs font-bold shadow-md"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  4. SECTION NAVIGATION TABS
                  ───────────────────────────────────────────────────────────── */}
              <div className="flex items-center gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-3 overflow-x-auto">
                {[
                  { key: 'academic', label: 'Academic & Professional', icon: '🩺' },
                  { key: 'contact', label: 'Contact & Institutional', icon: '📞' },
                  { key: 'schedule', label: 'Teaching Schedule & Modules', icon: '📚' },
                  { key: 'research', label: 'Research & CME Credits', icon: '🔬' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSection(tab.key as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
                      activeSection === tab.key
                        ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 border-[#5B4BFF]'
                        : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-[#E7EAF3] dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  5. TAB CONTENT GRIDS
                  ───────────────────────────────────────────────────────────── */}

              {/* TAB 1: ACADEMIC & PROFESSIONAL CREDENTIALS */}
              {activeSection === 'academic' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2.5">
                      <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                        <span>🩺</span>
                        <span>Clinical & Academic Qualifications</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-[#00C48C] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                        NMC Verified
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Employee ID</span>
                        <span className="font-mono font-black text-[#1B1E28] dark:text-white">{profile?.emp_id}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Designation</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.designation}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Clinical Specialization</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.specialization}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Degrees & Qualification</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.qualification}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Teaching Experience</span>
                        <span className="font-mono font-black text-[#00C48C]">{profile?.experience}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Medical Council Reg. No</span>
                        <span className="font-mono font-bold text-[#5B4BFF]">{profile?.nmc_reg_no}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2.5">
                      <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                        <span>🏛️</span>
                        <span>Institutional Standing & Tenure</span>
                      </h3>
                      <span className="text-[10px] font-bold text-[#4E5969]">Active Tenure</span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Assigned Department</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.department_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Date of Joining</span>
                        <span className="font-mono font-bold text-[#1B1E28] dark:text-white">{profile?.joining_date}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Academic Role</span>
                        <span className="font-bold text-[#F36C21]">Department Head & Lead Examiner</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">CBME Phase Head</span>
                        <span className="font-semibold text-[#1B1E28] dark:text-white">1st Professional MBBS (Phase I)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Biometric Device Mapping</span>
                        <span className="font-mono text-xs text-emerald-600 font-bold">Terminal BIO-04 (Synced)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT & DEPARTMENT INFORMATION */}
              {activeSection === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2.5 flex items-center gap-2">
                      <span>📞</span>
                      <span>Official Contact & Channels</span>
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Institutional Email</span>
                        <span className="font-mono font-bold text-[#5B4BFF]">{profile?.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Mobile Contact</span>
                        <span className="font-mono font-bold text-[#1B1E28] dark:text-white">{profile?.phone}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Intercom Extension</span>
                        <span className="font-mono font-bold text-[#1B1E28] dark:text-white">{profile?.intercom_ext}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Consultation Hours</span>
                        <span className="font-semibold text-[#1B1E28] dark:text-white">{profile?.office_hours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2.5 flex items-center gap-2">
                      <span>🏥</span>
                      <span>Department Location & Room Details</span>
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Faculty Cabin</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.cabin_room}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Department Office</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">Ground Floor, Anatomy &amp; Physiology Wing</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E7EAF3]/70 dark:border-slate-800/50">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Blood Group</span>
                        <span className="font-mono font-bold text-rose-600">{profile?.blood_group}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#4E5969] dark:text-slate-400 font-medium">Gender</span>
                        <span className="font-bold text-[#1B1E28] dark:text-white">{profile?.gender}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEACHING SCHEDULE & MODULES */}
              {activeSection === 'schedule' && (
                <div id="schedule-section" className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                        <span>📚</span>
                        <span>Current Academic Term Curriculum & Roster Allocation</span>
                      </h3>
                      <p className="text-[11px] text-[#7B8794] mt-0.5">NMC CBME Competency Curriculum — MBBS Phase I</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#5B4BFF] border border-indigo-200">
                      Academic Year 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                          THEORY (TH)
                        </span>
                        <span className="text-xs font-bold text-[#5B4BFF]">60 Hrs Allotted</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-[#1B1E28] dark:text-white">General &amp; Nerve-Muscle Physiology</h4>
                      <p className="text-[11px] text-[#7B8794]">Mon &amp; Wed 09:00 AM – 10:00 AM • Lecture Hall 1</p>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                          PRACTICAL (PR)
                        </span>
                        <span className="text-xs font-bold text-emerald-600">50 Hrs Allotted</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-[#1B1E28] dark:text-white">Hematology &amp; Clinical Examination Lab</h4>
                      <p className="text-[11px] text-[#7B8794]">Tue &amp; Thu 02:00 PM – 04:00 PM • Lab 2</p>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
                          AETCOM (AE)
                        </span>
                        <span className="text-xs font-bold text-purple-600">12 Hrs Allotted</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-[#1B1E28] dark:text-white">Module 2.1 — The Patient Interview</h4>
                      <p className="text-[11px] text-[#7B8794]">Friday 03:00 PM – 04:30 PM • Seminar Room</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RESEARCH, PUBLICATIONS & CME */}
              {activeSection === 'research' && (
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                        <span>🔬</span>
                        <span>Key Research Publications &amp; NMC Continuous Medical Education</span>
                      </h3>
                      <p className="text-[11px] text-[#7B8794] mt-0.5">Scopus / PubMed Indexed Clinical Studies</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      30 CME Credits
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-[#5B4BFF] bg-indigo-50 px-2 py-0.5 rounded-full">
                          IJPP (2025) • DOI: 10.4103/ijpp.2025.104
                        </span>
                        <h4 className="text-xs font-bold text-[#1B1E28] dark:text-white">
                          Evaluation of Heart Rate Variability &amp; Autonomic Tone in First-Year Medical Undergraduates
                        </h4>
                        <p className="text-[11px] text-[#7B8794]">Singh S., Sharma A., Pradhan A. — Indian Journal of Physiology and Pharmacology</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-[#E7EAF3] text-[#5B4BFF] shrink-0">
                        View Article ➔
                      </span>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-[#00C48C] bg-emerald-50 px-2 py-0.5 rounded-full">
                          JCDR (2024) • DOI: 10.7860/JCDR/2024/49102
                        </span>
                        <h4 className="text-xs font-bold text-[#1B1E28] dark:text-white">
                          Impact of Early Clinical Exposure on Physiology Comprehension: A Multi-Centric Assessment
                        </h4>
                        <p className="text-[11px] text-[#7B8794]">Singh S., Verma R. — Journal of Clinical and Diagnostic Research</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-[#E7EAF3] text-[#5B4BFF] shrink-0">
                        View Article ➔
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
