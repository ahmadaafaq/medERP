'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Institution {
  code: string;
  name: string;
  shortName: string;
  location: string;
  type: string;
  established: string;
  icon: string;
  color: string;
  slug: string;
  courses: string[];
}

const INSTITUTIONS: Institution[] = [
  {
    code: '1',
    name: 'SRMS College of Engineering & Technology',
    shortName: 'SRMS CET',
    location: 'Bareilly, UP',
    type: 'Engineering & Technology',
    established: '1996',
    icon: '⚙️',
    color: 'from-blue-600 to-indigo-700',
    slug: 'srms-cet-bareilly',
    courses: ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'B.Pharm', 'BCA'],
  },
  {
    code: '2',
    name: 'SRMS Institute of Medical Sciences (IMS)',
    shortName: 'SRMS IMS',
    location: 'Bareilly, UP',
    type: 'Medical & Healthcare',
    established: '2002',
    icon: '🏥',
    color: 'from-emerald-600 to-teal-700',
    slug: 'srms-ims',
    courses: ['MBBS', 'MD / MS', 'DM / M.Ch', 'Paramedical', 'Super Specialty'],
  },
  {
    code: '3',
    name: 'SRMS International Business School',
    shortName: 'SRMS IBS',
    location: 'Lucknow, UP',
    type: 'Management & Research',
    established: '2011',
    icon: '📊',
    color: 'from-purple-600 to-indigo-800',
    slug: 'srms-ibs-lucknow',
    courses: ['PGDM', 'MBA', 'BBA', 'B.Com (Hons)'],
  },
  {
    code: '4',
    name: 'SRMS College of Law',
    shortName: 'SRMS Law',
    location: 'Bareilly, UP',
    type: 'Legal Studies',
    established: '2018',
    icon: '⚖️',
    color: 'from-amber-600 to-orange-700',
    slug: 'srms-college-of-law',
    courses: ['BA.LL.B (5 Yrs)', 'LL.B (3 Yrs)', 'LL.M'],
  },
  {
    code: '5',
    name: 'SRMS College of Nursing',
    shortName: 'SRMS Nursing',
    location: 'Bareilly & Unnao',
    type: 'Nursing & Health Sciences',
    established: '2006',
    icon: '🩺',
    color: 'from-pink-600 to-rose-700',
    slug: 'srms-nursing-college',
    courses: ['B.Sc Nursing', 'Post Basic B.Sc', 'M.Sc Nursing', 'GNM'],
  },
  {
    code: '8',
    name: 'SRMS Riddhima - Centre for Performing Arts',
    shortName: 'SRMS Riddhima',
    location: 'Bareilly, UP',
    type: 'Arts & Cultural Heritage',
    established: '2020',
    icon: '🎭',
    color: 'from-violet-600 to-purple-700',
    slug: 'srms-riddhima-bareilly',
    courses: ['Classical Dance', 'Music & Vocals', 'Fine Arts', 'Theatre'],
  },
];

const TRUST_STATS = [
  { value: '35+', label: 'Years of Excellence', sub: 'Est. 1990 by SRMS Trust', icon: '🏛️' },
  { value: '15,000+', label: 'Alumni Network', sub: 'Global Leaders & Innovators', icon: '🎓' },
  { value: '100+', label: 'Acre Campuses', sub: 'Bareilly, Lucknow & Unnao', icon: '🌳' },
  { value: '100%', label: 'Placement Support', sub: 'Top MNCs & Fortune 500s', icon: '💼' },
  { value: '950+', label: 'Hospital Beds', sub: 'Multi-Specialty Care Centre', icon: '🏥' },
  { value: 'NAAC A', label: 'Accredited Excellence', sub: 'Approved by NBA, AICTE & NMC', icon: '⭐' },
];

export default function HomePage() {
  const [selectedInst, setSelectedInst] = useState<Institution>(INSTITUTIONS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'eng' | 'med' | 'mgmt'>('all');

  const filteredInstitutions = INSTITUTIONS.filter((inst) => {
    if (activeTab === 'eng') return inst.type.includes('Engineering');
    if (activeTab === 'med') return inst.type.includes('Medical') || inst.type.includes('Nursing');
    if (activeTab === 'mgmt') return inst.type.includes('Management') || inst.type.includes('Legal');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0A0D14] text-[#1B1E28] dark:text-slate-100 font-sans selection:bg-[#5B4BFF] selection:text-white transition-colors duration-200">
      
      {/* ─── TOP NOTIFICATION TICKER ────────────────────────────────────────── */}
      <div className="bg-[#1C1646] text-white text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-black text-[10px] tracking-wider uppercase shrink-0">
              OFFICIAL BULLETIN
            </span>
            <p className="text-white/90 text-xs font-medium truncate">
              📢 37th Smriti Diwas Celebration on 2nd October 2025 • Admissions Open for Academic Session 2025-26 across all SRMS Campuses.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-[11px] font-semibold text-white/80">
            <a href="tel:05812582246" className="hover:text-white transition-colors">📞 +91-581-2582246</a>
            <span className="text-white/30">•</span>
            <a href="mailto:info@srms.ac.in" className="hover:text-white transition-colors">✉️ info@srms.ac.in</a>
            <span className="text-white/30">•</span>
            <Link href="/login" className="text-[#F36C21] hover:underline font-bold">
              Student / Faculty ERP Login ➔
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN NAVIGATION HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#2D2575]/95 backdrop-blur-md border-b border-white/10 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-black bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] bg-clip-text text-transparent">
                SRMS
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  SHRI RAM MURTI SMARAK
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#F36C21] text-[9px] font-extrabold uppercase tracking-widest text-white">
                  TRUST
                </span>
              </div>
              <p className="text-[11px] text-white/75 font-medium tracking-wide">
                Institutions of Higher Education & Healthcare • Estd. 1990
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-white/90">
            <a href="#about" className="hover:text-[#F36C21] transition-colors">About Trust</a>
            <a href="#institutions" className="hover:text-[#F36C21] transition-colors">Institutions</a>
            <a href="#legacy" className="hover:text-[#F36C21] transition-colors">Founder Legacy</a>
            <a href="#stats" className="hover:text-[#F36C21] transition-colors">Achievements</a>
            <a href="#portals" className="hover:text-[#F36C21] transition-colors">ERP Modules</a>
          </nav>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#E25C10] hover:from-[#E25C10] hover:to-[#D14F05] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              <span>🚀 Access ERP Portal</span>
              <span className="group-hover:translate-x-1 transition-transform font-mono">➔</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION WITH CAMPUS PHOTO & SMRITI DIWAS BANNER ───────────── */}
      <section className="relative overflow-hidden bg-[#18123B] text-white pt-10 pb-20">
        
        {/* Background Campus Photo with Deep Atmospheric Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/srms_campus.png"
            alt="SRMS College of Engineering & Technology Campus"
            fill
            priority
            className="object-cover object-center opacity-35 filter blur-[0.5px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1646]/90 via-[#18123B]/80 to-[#18123B]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Top Pill / Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold tracking-wide uppercase shadow-sm">
              ✨ 35 Glorious Years of Educational Excellence (1990 - 2025)
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#00C48C]/20 border border-[#00C48C]/40 text-[#00C48C] text-xs font-black">
              ● All Systems Operational
            </span>
          </div>

          {/* Hero Headings */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Empowering Minds, Transforming Healthcare & Engineering
            </h1>
            <p className="text-sm sm:text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              Unified multi-campus academic enterprise ecosystem connecting students, faculty, healthcare specialists, and administrators across Bareilly, Lucknow, and Unnao.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4E3FE3] hover:to-[#6857F0] text-white font-black text-sm shadow-xl hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
              >
                <span>🔑 Login to ERP Portal</span>
                <span className="font-mono text-base">➔</span>
              </Link>
              <a
                href="#institutions"
                className="px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-sm transition-all cursor-pointer"
              >
                🏫 Explore Institutions
              </a>
            </div>
          </div>

          {/* ─── FRONT HIGHLIGHT BANNER: 37th SMRITI DIWAS (User Uploaded Image) ─── */}
          <div className="max-w-5xl mx-auto pt-4">
            <div className="p-2 sm:p-3 rounded-[26px] bg-gradient-to-r from-amber-500/30 via-purple-500/30 to-orange-500/30 backdrop-blur-xl border border-white/20 shadow-2xl">
              <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] md:aspect-[3/1] rounded-[22px] overflow-hidden bg-[#590D18] shadow-inner group">
                <Image
                  src="/images/srms_smriti_diwas_banner.png"
                  alt="37th Smriti Diwas - Late Ram Murti Ji - 35 Glorious Years"
                  fill
                  className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            </div>
            <p className="text-center text-xs text-white/60 pt-3">
              Commemorating 37th Smriti Diwas on 2nd October 2025 • Dedicated to Late Ram Murti Ji (08.02.1910 - 02.10.1988)
            </p>
          </div>

        </div>
      </section>

      {/* ─── KEY STATS BANNER ───────────────────────────────────────────────── */}
      <section id="stats" className="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRUST_STATS.map((stat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all hover:-translate-y-1 text-center space-y-1.5"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="text-2xl lg:text-3xl font-black text-[#2D2575] dark:text-[#5B4BFF] tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
                {stat.label}
              </p>
              <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── QUICK PORTAL LOGIN LAUNCHER SECTION ────────────────────────────── */}
      <section id="portals" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-extrabold text-[10px] tracking-widest uppercase">
            UNIFIED ERP DIRECT ACCESS
          </span>
          <h2 className="text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
            Role-Based Portal Gateway
          </h2>
          <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 leading-relaxed">
            Instant authenticated dashboard entry tailored for every member of the SRMS academic and clinical ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Student Portal */}
          <Link
            href="/login?role=STUDENT"
            className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-[#5B4BFF]/40 transition-all duration-300 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🎓
            </div>
            <h3 className="text-lg font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
              Student Academic Portal
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2 leading-relaxed font-medium">
              View course timetables, exam scores, real-time classroom attendance, and syllabus modules.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B4BFF]">
              <span>Sign in as Student</span>
              <span className="group-hover:translate-x-1 transition-transform font-mono">➔</span>
            </div>
          </Link>

          {/* Card 2: Faculty Portal */}
          <Link
            href="/login?role=FACULTY"
            className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-[#F36C21]/40 transition-all duration-300 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              👨‍🏫
            </div>
            <h3 className="text-lg font-black text-[#1B1E28] dark:text-white group-hover:text-[#F36C21] transition-colors">
              Faculty Teaching Portal
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2 leading-relaxed font-medium">
              Take live attendance, manage curriculum topics, enter exam marks, and verify assignments.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#F36C21]">
              <span>Sign in as Faculty</span>
              <span className="group-hover:translate-x-1 transition-transform font-mono">➔</span>
            </div>
          </Link>

          {/* Card 3: College Admin Console */}
          <Link
            href="/login?role=ADMIN"
            className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-[#00C48C]/40 transition-all duration-300 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🏛️
            </div>
            <h3 className="text-lg font-black text-[#1B1E28] dark:text-white group-hover:text-[#00C48C] transition-colors">
              Administrator Console
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2 leading-relaxed font-medium">
              Manage student masters, faculty appointments, departments, batches, and institution configuration.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#00C48C]">
              <span>Sign in as Admin</span>
              <span className="group-hover:translate-x-1 transition-transform font-mono">➔</span>
            </div>
          </Link>

          {/* Card 4: Examination & Clerk Office */}
          <Link
            href="/login?role=CLERK"
            className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="text-lg font-black text-[#1B1E28] dark:text-white group-hover:text-purple-600 transition-colors">
              Clerk & Examination Office
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2 leading-relaxed font-medium">
              Process student admissions, generate fee receipts, issue hall tickets, and record test papers.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Sign in as Clerk</span>
              <span className="group-hover:translate-x-1 transition-transform font-mono">➔</span>
            </div>
          </Link>

        </div>
      </section>

      {/* ─── INSTITUTIONS DIRECTORY ─────────────────────────────────────────── */}
      <section id="institutions" className="py-16 bg-white dark:bg-[#0E131F] border-y border-[#E7EAF3] dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-[#F36C21]/10 text-[#F36C21] font-extrabold text-[10px] tracking-widest uppercase">
                SRMS TRUST PORTFOLIO
              </span>
              <h2 className="text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Our Premier Institutions
              </h2>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400">
                Pioneering education in Engineering, Medicine, Business, Law, and Healthcare Sciences.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#2D2575] text-white shadow-sm'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white'
                }`}
              >
                All Institutions
              </button>
              <button
                onClick={() => setActiveTab('eng')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'eng'
                    ? 'bg-[#2D2575] text-white shadow-sm'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white'
                }`}
              >
                Engineering
              </button>
              <button
                onClick={() => setActiveTab('med')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'med'
                    ? 'bg-[#2D2575] text-white shadow-sm'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white'
                }`}
              >
                Medical & Nursing
              </button>
              <button
                onClick={() => setActiveTab('mgmt')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'mgmt'
                    ? 'bg-[#2D2575] text-white shadow-sm'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white'
                }`}
              >
                Management & Law
              </button>
            </div>
          </div>

          {/* Institutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((inst) => (
              <div
                key={inst.code}
                className="p-6 rounded-[22px] bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-2xl shadow-sm">
                      {inst.icon}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono text-[10px] font-black">
                      Estd. {inst.established}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#F36C21] uppercase tracking-wider">
                      {inst.type}
                    </span>
                    <h3 className="text-lg font-black text-[#1B1E28] dark:text-white tracking-tight group-hover:text-[#5B4BFF] transition-colors">
                      {inst.name}
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">
                      📍 {inst.location}
                    </p>
                  </div>

                  {/* Course Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {inst.courses.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 text-[11px] font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800">
                  <Link
                    href={`/login?college=${inst.slug}`}
                    className="w-full py-2.5 rounded-xl bg-[#2D2575] hover:bg-[#5B4BFF] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter {inst.shortName} ERP</span>
                    <span className="font-mono">➔</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── FOUNDER LEGACY TRIBUTE SECTION ─────────────────────────────────── */}
      <section id="legacy" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-[28px] bg-gradient-to-r from-[#2D2575] via-[#3A2E99] to-[#2D2575] text-white shadow-xl relative overflow-hidden">
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F36C21] text-white font-extrabold text-[10px] tracking-widest uppercase">
                  FOUNDER PHILOSOPHY
                </span>
                <span className="text-xs text-white/80 font-mono">
                  1910 — 1988
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Late Shri Ram Murti Ji
              </h2>
              <p className="text-sm text-white/90 font-medium">
                Veteran Freedom Fighter • True Gandhian • Ex-Parliamentarian • Former Minister, Govt of Uttar Pradesh
              </p>
              <blockquote className="text-xs sm:text-sm text-white/80 italic border-l-2 border-[#F36C21] pl-4 py-1 leading-relaxed">
                "Real education is that which enables one to stand on his own legs, develop a strong moral character, and dedicate his life to the service of humanity and nation-building."
              </blockquote>
              <p className="text-xs text-white/75 leading-relaxed">
                Under his visionary inspiration, SRMS Trust was founded in 1990 by Chairman Shri Dev Murti Ji with a commitment to provide world-class technical education, medical healthcare, and compassionate service to society.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-3">
              <span className="text-4xl">🏅</span>
              <p className="text-3xl font-black text-white">35 Years</p>
              <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Unbroken Educational Heritage
              </p>
              <p className="text-[11px] text-white/70">
                1990 to 2025 • Bareilly, Lucknow, Unnao
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#18123B] text-white/80 border-t border-white/10 pt-12 pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">SRMS TRUST</span>
                <span className="px-1.5 py-0.5 rounded bg-[#F36C21] text-[9px] font-bold text-white uppercase">
                  ESTD. 1990
                </span>
              </div>
              <p className="text-white/70 leading-relaxed text-[11px]">
                Pioneering leader in Technical, Professional, Medical Education & Super-Specialty Health Care.
              </p>
              <p className="text-[11px] text-white/60">
                Ram Murti Puram, 13 KM Bareilly-Nainital Road, Bareilly - 243202 (UP)
              </p>
            </div>

            {/* Col 2: Institutions */}
            <div className="space-y-2">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Campuses</p>
              <ul className="space-y-1.5 text-white/70 text-[11px]">
                <li>SRMS CET Bareilly (Engineering & Pharmacy)</li>
                <li>SRMS Institute of Medical Sciences (IMS Hospital)</li>
                <li>SRMS International Business School, Lucknow</li>
                <li>SRMS College of Nursing, Bareilly & Unnao</li>
                <li>SRMS College of Law, Bareilly</li>
              </ul>
            </div>

            {/* Col 3: Quick ERP Portals */}
            <div className="space-y-2">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Direct ERP Access</p>
              <ul className="space-y-1.5 text-white/70 text-[11px]">
                <li><Link href="/login?role=STUDENT" className="hover:text-[#F36C21] transition">Student Academic Portal</Link></li>
                <li><Link href="/login?role=FACULTY" className="hover:text-[#F36C21] transition">Faculty Teaching Portal</Link></li>
                <li><Link href="/login?role=ADMIN" className="hover:text-[#F36C21] transition">College Administrator Console</Link></li>
                <li><Link href="/login?role=CLERK" className="hover:text-[#F36C21] transition">Clerk & Examination Office</Link></li>
                <li><Link href="/login?role=WARDEN" className="hover:text-[#F36C21] transition">Hostel & Warden Desk</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Accreditation */}
            <div className="space-y-2">
              <p className="text-white font-bold uppercase tracking-wider text-xs">Accreditations</p>
              <p className="text-white/70 text-[11px] leading-relaxed">
                Approved by AICTE, PCI, INC, Bar Council of India, NMC & NAAC Accredited.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3FE3] text-white font-bold text-xs inline-block transition"
                >
                  Go to Login Page ➔
                </Link>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/60">
            <p>© {new Date().getFullYear()} Shri Ram Murti Smarak (SRMS) Institutions. All Rights Reserved.</p>
            <p className="font-mono text-[10px]">UniCampus MedERP Platform • Schema-Isolated Multi-Tenant Architecture</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
