'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CollegeTenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active?: boolean;
}

const DEFAULT_COLLEGES: CollegeTenant[] = [
  {
    id: 'rajshreemri-default',
    name: 'Rajshree Medical Research Institute Bareilly',
    slug: 'rajshreemri',
    domain: 'https://rajshreemri.in/',
    plan: 'Enterprise',
    primary_color: '#5B4BFF',
    is_active: true,
  },
  {
    id: 'srms-ims-default',
    name: 'SRMS Institute of Medical Sciences Bareilly',
    slug: 'srms-ims',
    domain: 'https://srms.ac.in/ims',
    plan: 'Enterprise',
    primary_color: '#2D2575',
    is_active: true,
  },
  {
    id: 'kgmu-default',
    name: 'King George’s Medical University Campus',
    slug: 'kgmu-lko',
    domain: 'https://kgmu.org',
    plan: 'Govt Enterprise',
    primary_color: '#1B1E28',
    is_active: true,
  },
  {
    id: 'era-default',
    name: 'Era Medical College & Hospital',
    slug: 'era-univ',
    domain: 'https://eramc.in',
    plan: 'Enterprise',
    primary_color: '#F36C21',
    is_active: true,
  },
];

export default function Home() {
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [colleges, setColleges] = useState<CollegeTenant[]>(DEFAULT_COLLEGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<CollegeTenant | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Login Form State
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real colleges from backend
  useEffect(() => {
    async function loadColleges() {
      try {
        const res = await fetch('http://localhost:3001/api/v1/college-master/colleges');
        if (res.ok) {
          const json = await res.json();
          const list: CollegeTenant[] = json.data || (Array.isArray(json) ? json : []);
          if (list && list.length > 0) {
            const map = new Map<string, CollegeTenant>();
            DEFAULT_COLLEGES.forEach(c => map.set(c.slug, c));
            list.forEach(c => map.set(c.slug, c));
            setColleges(Array.from(map.values()));
          }
        }
      } catch (err) {
        console.warn('Using fallback tenant list:', err);
      }
    }
    loadColleges();
  }, []);

  // Handle outside clicks to close auto-complete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredColleges = colleges.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.domain && c.domain.toLowerCase().includes(q))
    );
  });

  const handleSelectCollege = (college: CollegeTenant) => {
    setSelectedCollege(college);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setErrorMsg('');
    localStorage.setItem('tenantSlug', college.slug);
    localStorage.setItem('collegeName', college.name);
    applyRolePreset(role);
  };

  const applyRolePreset = (r: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN') => {
    setRole(r);
    setErrorMsg('');
    if (r === 'ADMIN') {
      setEmail('admin');
      setPassword('admin@123');
    } else if (r === 'CLERK') {
      setEmail('1234');
      setPassword('1234');
    } else if (r === 'STUDENT') {
      setEmail('2023MBBS045');
      setPassword('2023MBBS045');
    } else if (r === 'FACULTY') {
      setEmail('EMP1001');
      setPassword('Password@123');
    } else if (r === 'WARDEN') {
      setEmail('warden');
      setPassword('warden123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) {
      setErrorMsg('Please select your institution first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const targetSlug = selectedCollege.slug;

    try {
      const res = await fetch(`http://localhost:3001/api/v1/auth/login?tenant=${targetSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: role === 'ADMIN' ? 'COLLEGE_ADMIN' : role,
          tenantSlug: targetSlug,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const authData = json.data || json;
        const accessToken = authData.accessToken || authData.access_token;
        const refreshToken = authData.refreshToken || authData.refresh_token;

        if (accessToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken || '');
          localStorage.setItem('tenantSlug', targetSlug);
          localStorage.setItem('collegeName', selectedCollege.name);
          localStorage.setItem('role', role);

          if (authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));
            const uDeptId = authData.user.departmentId || authData.user.department_id || authData.user.profile?.department_id || '';
            const uDeptName = authData.user.departmentName || authData.user.department_name || authData.user.profile?.department_name || '';
            const uSubjId = authData.user.subjectId || authData.user.subject_id || authData.user.profile?.subject_id || '';
            const uSubjName = authData.user.subjectName || authData.user.subject_name || authData.user.profile?.primary_subject_name || '';

            if (uDeptId) localStorage.setItem('departmentId', uDeptId);
            if (uDeptName) localStorage.setItem('departmentName', uDeptName);
            if (uSubjId) localStorage.setItem('subjectId', uSubjId);
            if (uSubjName) localStorage.setItem('subjectName', uSubjName);
          }

          window.location.href = `/dashboard/${role.toLowerCase()}`;
          return;
        }
      }

      const msg = json.message || 'Invalid credentials or inactive account for this college.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } catch (err) {
      setErrorMsg('Failed to connect to MedERP authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors selection:bg-[#5B4BFF] selection:text-white flex flex-col">
      
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-WIDTH STICKY NAVIGATION BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[#E7EAF3] dark:border-slate-800 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF] text-white flex items-center justify-center text-2xl shadow-md font-black">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F36C21] bg-[#FFF4EC] dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-[#F36C21]/20">
                  Universal Medical ERP
                </span>
                <span className="text-[10px] text-[#7B8794] font-mono">v2.4.0</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white tracking-tight leading-tight">
                MedERP Universal Platform
              </h1>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#4E5969] dark:text-slate-300">
            <a href="#campuses" className="hover:text-[#5B4BFF] transition-colors">Affiliated Campuses</a>
            <a href="#conference" className="hover:text-[#5B4BFF] transition-colors">National Conference</a>
            <a href="#modules" className="hover:text-[#5B4BFF] transition-colors">Ecosystem Modules</a>
            <a href="#security" className="hover:text-[#5B4BFF] transition-colors">Schema Isolation</a>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedCollege(null); setShowPortalModal(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🔐</span>
              <span>Access Portal Login</span>
            </button>
          </div>

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION — FULL-WIDTH PANORAMIC CONFERENCE BANNER
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        
        {/* Clickable Hero Showcase */}
        <div
          onClick={() => { setShowPortalModal(true); setSelectedCollege(null); }}
          className="w-full rounded-[28px] overflow-hidden border border-[#E7EAF3] dark:border-slate-800 shadow-xl group cursor-pointer relative bg-[#2D2575] transform hover:-translate-y-1 transition-all duration-300"
          title="Click to Access MedERP Portal Login"
        >
          {/* Main Panoramic Image */}
          <img
            src="/conference_banner.png"
            alt="Rajshree Nursing Institute Bareilly — National Conference CARE CORE"
            className="w-full h-auto max-h-[440px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
          />

          {/* Floating Interactive CTA Overlay */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-full bg-[#2D2575]/90 hover:bg-[#5B4BFF] backdrop-blur-md text-white font-extrabold text-xs shadow-2xl border border-white/30 flex items-center gap-2 transition-all group-hover:scale-105">
              <span>🔐</span>
              <span>Click to Enter Medical ERP</span>
              <span className="text-amber-300">➔</span>
            </div>
          </div>
        </div>

        {/* Live Ecosystem KPI Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] flex items-center justify-center font-bold text-base">
              🏛️
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7B8794] block">Institutions</span>
              <span className="text-sm font-black text-[#1B1E28] dark:text-white font-mono">16+ Campuses</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00C48C] flex items-center justify-center font-bold text-base">
              🩺
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7B8794] block">NMC Status</span>
              <span className="text-sm font-black text-[#00C48C]">100% CBME</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#FFB020] flex items-center justify-center font-bold text-base">
              🎓
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7B8794] block">Active Scholars</span>
              <span className="text-sm font-black text-[#1B1E28] dark:text-white font-mono">12,500+</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#7867FF] flex items-center justify-center font-bold text-base">
              🔒
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7B8794] block">Isolation</span>
              <span className="text-sm font-black text-[#7867FF]">PostgreSQL Schema</span>
            </div>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DIRECT CAMPUS HUBS & TENANT SELECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="campuses" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
          <div>
            <span className="text-[10px] font-black text-[#F36C21] uppercase tracking-widest bg-[#FFF4EC] dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-[#F36C21]/20">
              Campus Portals
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white mt-1">
              Select Your Affiliated Medical Institution
            </h2>
          </div>
          <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md">
            Directly launch your college’s schema-isolated portal with one click or search the university registry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Rajshree MRI */}
          <div
            onClick={() => { handleSelectCollege(DEFAULT_COLLEGES[0]); setShowPortalModal(true); }}
            className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-[#5B4BFF] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  🏛️
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                  rajshreemri
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-snug">
                  Rajshree Medical Research Institute Bareilly
                </h3>
                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 mt-1">
                  MBBS, MD/MS, Nursing &amp; Allied Health Sciences Campus Hub.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B4BFF]">
              <span>Sign In to Rajshree</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>

          {/* Card 2: SRMS IMS */}
          <div
            onClick={() => { handleSelectCollege(DEFAULT_COLLEGES[1]); setShowPortalModal(true); }}
            className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-[#5B4BFF] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D2575] to-[#7867FF] text-white flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  🏥
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-50 text-[#5B4BFF] border border-indigo-200">
                  srms-ims
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-snug">
                  SRMS Institute of Medical Sciences Bareilly
                </h3>
                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 mt-1">
                  Tertiary Super-Speciality Hospital &amp; Medical College ERP Portal.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B4BFF]">
              <span>Sign In to SRMS IMS</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>

          {/* Card 3: Search All Campuses */}
          <div
            onClick={() => { setSelectedCollege(null); setShowPortalModal(true); }}
            className="p-6 rounded-[24px] bg-gradient-to-br from-[#2D2575]/5 via-[#5B4BFF]/10 to-transparent border border-[#5B4BFF]/30 shadow-sm hover:shadow-lg hover:border-[#5B4BFF] transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                  🔍
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00C48C]/15 text-[#00C48C]">
                  Live Registry
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-snug">
                  Search Affiliated Medical Campuses
                </h3>
                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 mt-1">
                  Access government &amp; private medical colleges configured on the MedERP network.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B4BFF]">
              <span>Open Campus Finder</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. NATIONAL CONFERENCE SPOTLIGHT SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="conference" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-[28px] bg-gradient-to-r from-[#2D2575] via-[#221C5C] to-[#3B2F96] text-white p-8 sm:p-10 shadow-xl relative overflow-hidden">
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-[#F36C21]">
                <span>⭐</span>
                <span>Organized by Rajshree Nursing Institute, Bareilly</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                National Conference: CARE CORE 2026
              </h2>
              <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
                Advances in Nursing Teaching Methodology and Artificial Intelligence Integration. Accredited with <strong>One Credit Hour by UP Nurses &amp; Midwives Council Lucknow</strong>.
              </p>

              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                  <span>📅</span>
                  <span className="font-bold">Saturday, 9th May 2026</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                  <span>📍</span>
                  <span className="font-bold">Rajshree Campus, Bareilly (UP)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
                  <span>🎓</span>
                  <span className="font-bold">UP Nurses Council Accredited</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={() => { handleSelectCollege(DEFAULT_COLLEGES[0]); setShowPortalModal(true); }}
                className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-[#2D2575] font-extrabold text-xs shadow-lg transition-all text-center cursor-pointer"
              >
                🏥 Access Rajshree Portal
              </button>
              <button
                onClick={() => { setSelectedCollege(null); setShowPortalModal(true); }}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#5B4BFF] hover:bg-[#4837E8] text-white font-extrabold text-xs shadow-lg transition-all text-center cursor-pointer"
              >
                🔐 University ERP Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. COMPREHENSIVE MEDICAL ERP ECOSYSTEM MODULES
          ───────────────────────────────────────────────────────────── */}
      <section id="modules" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-[10px] font-black text-[#5B4BFF] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-200">
            Integrated Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white">
            Complete Medical University &amp; Hospital Ecosystem
          </h2>
          <p className="text-xs text-[#4E5969] dark:text-slate-400">
            End-to-end management spanning NMC CBME curriculum, clinical logbooks, examination registers, and multi-tenant hostels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🩺', title: 'NMC CBME Curriculum', desc: 'Pre-Clinical, Para-Clinical & Clinical phase-wise competencies with faculty audit sign-offs.' },
            { icon: '📘', title: 'UG & PG Clinical Logbooks', desc: 'Real-time procedure logging with faculty marker verifications and digital competency seals.' },
            { icon: '📊', title: 'Examination & Result Vault', desc: 'Internal assessments, university professional exams, theory/practical breakdown and grading.' },
            { icon: '🕒', title: 'Biometric Attendance & Rosters', desc: 'Live biometric sync, NMC-compliant attendance percentages, and clinical ward shift schedules.' },
            { icon: '🏢', title: 'Hostel & Mess Management', desc: 'Digital room allocations, hostel clearance passes, warden disciplinary registers, and complaints.' },
            { icon: '🔒', title: 'PostgreSQL Schema Isolation', desc: 'Dedicated schema-per-tenant architecture ensuring complete medical data isolation & security.' },
          ].map((mod, i) => (
            <div
              key={i}
              className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#5B4BFF]/50 transition-all space-y-2.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-2xl flex items-center justify-center">
                {mod.icon}
              </div>
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">{mod.title}</h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 leading-relaxed">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. COMPACT MODAL / PORTAL ACCESS DIALOG (SMALL PADDING PREMIUM UI)
          ───────────────────────────────────────────────────────────── */}
      {showPortalModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2D2575] via-[#352B88] to-[#2D2575] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏥</span>
                <div>
                  <h3 className="text-sm font-black text-white">MedERP Portal Access</h3>
                  <p className="text-[10px] text-white/70">Secure Medical University Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowPortalModal(false)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xs font-black transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body — Small Padding Compact UI */}
            <div className="p-5 space-y-4 text-xs">
              
              {!selectedCollege ? (
                /* STAGE 1: Fast College Tenant Search */
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-300 block mb-1.5">
                      1. Select Your Medical College / Tenant
                    </label>
                    
                    <div className="relative" ref={searchContainerRef}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search institution (e.g. Rajshree, SRMS, Bareilly)..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF]"
                        autoFocus
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-[#7B8794]">🔍</span>

                      {/* Dropdown Results */}
                      {isDropdownOpen && (
                        <div className="absolute top-[105%] left-0 right-0 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700 shadow-xl z-50 p-1.5 space-y-1">
                          {filteredColleges.length === 0 ? (
                            <div className="p-3 text-center text-xs text-[#7B8794]">No institution found.</div>
                          ) : (
                            filteredColleges.map((college) => (
                              <button
                                key={college.slug}
                                type="button"
                                onClick={() => handleSelectCollege(college)}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-[#F6F8FC] dark:hover:bg-slate-750 transition-all flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-[#1B1E28] dark:text-white truncate">{college.name}</p>
                                  <p className="text-[10px] font-mono text-[#7B8794]">tenant_{college.slug}</p>
                                </div>
                                <span className="text-[#5B4BFF] font-bold text-xs shrink-0">Select ➔</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Select Preset List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8794]">Featured Campuses:</span>
                    <div className="space-y-1.5">
                      {colleges.slice(0, 3).map((c) => (
                        <button
                          key={c.slug}
                          onClick={() => handleSelectCollege(c)}
                          className="w-full p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-white border border-[#E7EAF3] dark:border-slate-700 text-left flex items-center justify-between transition-all cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1B1E28] dark:text-white truncate">{c.name}</p>
                            <p className="text-[10px] font-mono text-[#7B8794]">tenant: {c.slug}</p>
                          </div>
                          <span className="text-xs text-[#5B4BFF]">➔</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* STAGE 2: Compact Login Form (No Oversized Padding) */
                <div className="space-y-3.5">
                  
                  {/* Selected College Header Badge */}
                  <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                        Active Campus
                      </span>
                      <h4 className="text-xs font-extrabold text-[#1B1E28] dark:text-white truncate mt-0.5">
                        {selectedCollege.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedCollege(null)}
                      className="text-[11px] font-bold text-[#5B4BFF] hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>

                  {/* Compact Role Selection Tabs */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7B8794] mb-1.5">
                      Select Role
                    </label>
                    <div className="grid grid-cols-5 gap-1 p-1 bg-[#F6F8FC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700 text-center">
                      {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => applyRolePreset(r)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            role === r
                              ? 'bg-[#5B4BFF] text-white shadow-xs'
                              : 'text-[#7B8794] hover:text-[#1B1E28] dark:hover:text-white'
                          }`}
                        >
                          {r === 'ADMIN' ? 'Admin' : r === 'CLERK' ? 'Clerk' : r.charAt(0) + r.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-300 mb-1">
                        {role === 'STUDENT' ? 'Registration Number' : role === 'FACULTY' ? 'Faculty Emp ID' : 'Username / Email'}
                      </label>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === 'STUDENT' ? '2023MBBS045' : role === 'FACULTY' ? 'EMP1001' : 'admin'}
                        className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-300 mb-1">
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-xs text-[#7B8794]"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      {loading ? (
                        <span>Authenticating...</span>
                      ) : (
                        <span>Sign In to {selectedCollege.slug.toUpperCase()} ➔</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-[#F6F8FC] dark:bg-slate-850 px-5 py-3 border-t border-[#E7EAF3] dark:border-slate-800 text-[11px] text-[#7B8794] flex items-center justify-between">
              <span>© 2026 MedERP Schema Isolation</span>
              <button
                onClick={() => setSelectedCollege(null)}
                className="text-[#5B4BFF] font-bold hover:underline"
              >
                Reset Search
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. FULL-WIDTH EXECUTIVE FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="w-full mt-auto bg-white dark:bg-slate-900 border-t border-[#E7EAF3] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#4E5969] dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2D2575] text-white flex items-center justify-center font-bold text-sm">
              🏥
            </div>
            <div>
              <p className="font-extrabold text-[#1B1E28] dark:text-white">MedERP Universal Platform</p>
              <p className="text-[11px] text-[#7B8794]">Multi-Tenant Medical College &amp; Hospital Management System</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#campuses" className="hover:text-[#5B4BFF]">Campuses</a>
            <a href="#conference" className="hover:text-[#5B4BFF]">CARE CORE 2026</a>
            <a href="#modules" className="hover:text-[#5B4BFF]">CBME Modules</a>
            <button
              onClick={() => { setSelectedCollege(null); setShowPortalModal(true); }}
              className="text-[#5B4BFF] font-extrabold hover:underline"
            >
              Sign In
            </button>
          </div>

          <div className="text-[11px] text-[#7B8794] text-center md:text-right">
            © 2026 MedERP Platform. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
