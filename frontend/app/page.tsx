'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Banner images (statically imported so Next.js can optimise & fingerprint)
import bannerNx1 from './assets/banners/nx1.jpeg';
import bannerNx2 from './assets/banners/nx2.jpeg';
import bannerNx3 from './assets/banners/nx3.jpeg';

const BANNERS = [
  {
    src: bannerNx1,
    title: 'The Operating System for World-Class Universities',
    subtitle: 'Empowering medical colleges, engineering institutes & university hospitals with autonomous AI operations and connected mobile apps.',
    badge: 'AI-Driven University Infrastructure',
  },
  {
    src: bannerNx2,
    title: 'Autonomous AI Timetables & Smart Clinical Rotations',
    subtitle: 'CorteX.io eliminates scheduling conflicts, automates clinical postings and delivers predictive student success analytics at scale.',
    badge: 'CorteX.io AI Core · NMC & AICTE Compliant',
  },
  {
    src: bannerNx3,
    title: 'Powered by Nornx Technologies — Built for India',
    subtitle: 'Multi-institution cloud ERP with dedicated mobile apps, biometric NFC attendance, digital ID wallets & real-time campus alerts.',
    badge: 'Enterprise · MED & NON-MED Suite',
  },
] as const;

interface TenantInstitution {
  id?: string;
  code: string;
  name: string;
  shortName?: string;
  location?: string;
  category?: 'MED' | 'NONMED' | 'BOTH';
  type?: string;
  icon?: string;
  logo_url?: string;
  slug: string;
  domain?: string;
  plan?: string;
  is_active?: boolean;
  courses?: string[];
}

const FEATURED_DEMO_INSTITUTIONS: TenantInstitution[] = [
  {
    code: '1',
    name: 'SRMS College of Engineering & Technology, Bareilly',
    shortName: 'SRMS CET',
    location: 'Bareilly, Uttar Pradesh',
    category: 'NONMED',
    type: 'Engineering, Technology & Pharmacy',
    icon: '⚙️',
    logo_url: '/srms-logo.png',
    slug: 'srms-cet-bareilly',
    domain: 'srms-cet.mederp.app',
    courses: ['B.Tech Computer Science', 'M.Tech AI/ML', 'MCA', 'MBA', 'B.Pharm', 'BCA'],
    is_active: true,
  },
  {
    code: '11',
    name: 'SRMS Institute of Medical Sciences (IMS), Bareilly',
    shortName: 'SRMS IMS',
    location: 'Bareilly, Uttar Pradesh',
    category: 'MED',
    type: 'Medical University & Super Specialty Hospital',
    icon: '🏥',
    logo_url: '/srms-logo.png',
    slug: 'srms-ims',
    domain: 'srms-ims.mederp.app',
    courses: ['M.B.B.S. (NMC)', 'M.D. General Medicine', 'M.S. General Surgery', 'M.D. Radio-Diagnosis', 'Super Specialty'],
    is_active: true,
  },
];

export default function UniCampusBrandHomePage() {
  const [institutions, setInstitutions] = useState<TenantInstitution[]>(FEATURED_DEMO_INSTITUTIONS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MED' | 'NONMED'>('ALL');
  const [activeTab, setActiveTab] = useState<'ai' | 'med' | 'nonmed' | 'mobile'>('ai');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // ── Banner slider state
  const [currentBanner, setCurrentBanner] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const goToBanner = useCallback((index: number) => {
    if (index === currentBanner || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBanner(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentBanner, isTransitioning]);

  const nextBanner = useCallback(() => {
    goToBanner((currentBanner + 1) % BANNERS.length);
  }, [currentBanner, goToBanner]);

  const prevBanner = useCallback(() => {
    goToBanner((currentBanner - 1 + BANNERS.length) % BANNERS.length);
  }, [currentBanner, goToBanner]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchActiveInstitutions();
  }, []);

  // ── Auto-advance banner slider every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchActiveInstitutions = async () => {
    try {
      const map = new Map<string, TenantInstitution>();

      // 1. Fetch from college-master
      try {
        const res = await fetch('/api/college-master/colleges');
        if (res.ok) {
          const json = await res.json();
          const list: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          list.forEach((item) => {
            if (item.is_active === false) return;
            const slug = item.slug || `srms-${item.code || item.colg_cd}`;
            if (slug.includes('ibs') || slug.includes('law') || item.name?.toLowerCase().includes('ibs') || item.name?.toLowerCase().includes('law')) {
              return;
            }
            const isMed =
              slug.includes('ims') ||
              slug.includes('medical') ||
              slug.includes('nursing') ||
              slug.includes('iahs') ||
              slug.includes('hospital') ||
              item.name?.toLowerCase().includes('medical');

            const logoUrl = item.logo_url || (slug.startsWith('srms') ? '/srms-logo.png' : undefined);

            map.set(slug, {
              id: item.id,
              code: String(item.code || item.colg_cd || '1'),
              name: item.name,
              shortName: item.name?.split(',')[0] || item.name,
              location: item.name?.includes('LUCKNOW')
                ? 'Lucknow, UP'
                : item.name?.includes('UNNAO')
                  ? 'Unnao, UP'
                  : 'Bareilly, UP',
              category: isMed ? 'MED' : 'NONMED',
              type: isMed ? 'Medical University & Hospital' : 'Engineering & Higher Education',
              icon: isMed ? '🏥' : '⚙️',
              logo_url: logoUrl,
              slug,
              domain: item.domain || `${slug}.mederp.app`,
              plan: item.plan || 'enterprise',
              is_active: true,
              courses: isMed
                ? ['M.B.B.S.', 'M.D. / M.S.', 'Nursing', 'Super Specialty']
                : ['B.Tech / B.E.', 'M.Tech', 'MCA / BCA'],
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch colleges from master:', e);
      }

      // 2. Fetch from SaaS firms
      try {
        const firmsRes = await fetch('/api/firms?public=true');
        if (firmsRes.ok) {
          const firmsJson = await firmsRes.json();
          const firmsList: any[] = Array.isArray(firmsJson.data)
            ? firmsJson.data
            : Array.isArray(firmsJson)
              ? firmsJson
              : [];
          firmsList.forEach((f) => {
            if (f.status === 'SUSPENDED' || f.status === 'INACTIVE' || f.is_active === false) {
              map.delete(f.slug);
              return;
            }
            if (f.slug && f.title) {
              if (f.slug.includes('ibs') || f.slug.includes('law') || f.title.toLowerCase().includes('ibs') || f.title.toLowerCase().includes('law')) {
                return;
              }
              const isMed = f.firm_mode === 'MED' || f.slug.includes('ims') || f.title.toLowerCase().includes('medical');
              const logoUrl = f.logo_url || (f.slug.startsWith('srms') ? '/srms-logo.png' : undefined);
              map.set(f.slug, {
                id: f.id,
                code: f.slug,
                name: f.title,
                shortName: f.title.split(',')[0],
                location: f.domain || `${f.slug}.mederp.app`,
                category: isMed ? 'MED' : 'NONMED',
                type: isMed ? 'Medical & Healthcare Institution' : 'Technical & Professional College',
                icon: isMed ? '🏥' : '⚙️',
                logo_url: logoUrl,
                slug: f.slug,
                domain: f.domain || `${f.slug}.mederp.app`,
                plan: f.level_type || 'standard',
                is_active: true,
                courses: isMed ? ['MBBS', 'Clinical Postings'] : ['Engineering', 'Technology'],
              });
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch firms:', e);
      }

      if (map.size > 0) {
        setInstitutions(Array.from(map.values()));
      }
    } catch {
      // Keep default
    }
  };

  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchesCategory =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'MED' && inst.category === 'MED') ||
        (categoryFilter === 'NONMED' && inst.category !== 'MED');

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        inst.name.toLowerCase().includes(q) ||
        (inst.shortName && inst.shortName.toLowerCase().includes(q)) ||
        inst.slug.toLowerCase().includes(q) ||
        inst.code.toLowerCase().includes(q)
      );
    });
  }, [institutions, searchQuery, categoryFilter]);

  const quickMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return institutions
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.shortName && i.shortName.toLowerCase().includes(q)) ||
          i.slug.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [institutions, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#F36C21] selection:text-white">
      {/* ─── 1. TOP ANNOUNCEMENT BAR (Clean & Sleek) ────────────────────────── */}
      <div className="bg-gradient-to-r from-[#FFF5ED] via-[#F0F5FF] to-[#FFF5ED] border-b border-[#FBE0D0]/60 text-xs py-1.5 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-black text-[9px] sm:text-[10px] tracking-wide uppercase shadow-xs shrink-0">
              AI CLOUD v3.0
            </span>
            <p className="text-[#334155] text-xs font-semibold truncate">
              ✨ Autonomous AI Timetables & Smart Clinical Rotations live.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-[11px] font-bold text-[#475569]">
            <Link href="/access/superadmin" className="text-[#F36C21] hover:text-[#D1510B] transition-colors flex items-center gap-1">
              <span>⚡ Platform SuperAdmin</span>
            </Link>
            <span className="text-[#CBD5E1]">•</span>
            <Link href="/login" className="hover:text-[#0F172A] transition-colors">
              🔑 Institutional Login
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. STICKY DARK BRAND HEADER ────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/15 shadow-xl'
          : 'bg-[#0B0F19]/85 backdrop-blur-md border-b border-white/10'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & UniCampus Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white p-1 shadow-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/unicampus-icon.png"
                alt="UniCampus Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-black tracking-tight text-white leading-tight">
                  UniCampus
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#FFF5ED] border border-[#FBE0D0] text-[#F36C21] text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  AI CLOUD
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#94A3B8] font-medium tracking-wide truncate hidden xs:block">
                Next-Gen University ERP & Healthcare OS
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-extrabold text-[#94A3B8]">
            <a href="#solutions" className="hover:text-white transition-colors">
              Platform Solutions
            </a>
            <a href="#med-ai" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>🏥 MED ERP</span>
            </a>
            <a href="#eng-ai" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>⚙️ Engineering ERP</span>
            </a>
            <a href="#mobile-app" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>📱 Mobile Apps</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/access/superadmin"
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-white/20 hover:border-white/40 bg-white text-[#0F172A] font-extrabold text-xs shadow-sm hover:bg-white/90 transition-all"
            >
              Owner Portal
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#E05A10] hover:from-[#E05A10] hover:to-[#C94A06] text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all transform active:scale-95 flex items-center gap-1.5 group cursor-pointer whitespace-nowrap"
            >
              <span>🔑 Go to Login</span>
              <span className="group-hover:translate-x-0.5 transition-transform font-mono">➔</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FULL-BLEED BANNER SLIDER HERO
          - Cinematic image carousel (nx1, nx2, nx3)
          - Dark gradient overlay for text legibility
          - Auto-advances every 5s with smooth fade transition
          - Headline + search bar + stats overlaid on top
      ═══════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════
          3. VIBRANT BRAND ORANGE HERO CANVAS
          - Premium solid orange gradient matching brand identity (#EA580C -> #F36C21 -> #C2410C)
          - Geometric lighting overlay + ambient glow
          - Rotating slide headlines + live campus search + stats strip
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EA580C] via-[#F36C21] to-[#C2410C] text-white min-h-[500px] sm:min-h-[75vh] lg:min-h-[82vh] flex flex-col justify-between">

        {/* ── Geometric ambient lighting overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,1) 1.5px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-black/25 blur-3xl pointer-events-none" />

        {/* ── PREV / NEXT ARROWS */}
        <button
          onClick={prevBanner}
          className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white flex items-center justify-center text-base sm:text-xl font-bold transition-all hover:scale-110 shadow-lg cursor-pointer"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={nextBanner}
          className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white flex items-center justify-center text-base sm:text-xl font-bold transition-all hover:scale-110 shadow-lg cursor-pointer"
          aria-label="Next"
        >
          ›
        </button>

        {/* ── HERO MAIN CONTENT */}
        <div className="relative z-40 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28 my-auto">

          {/* Slide Badge & Elevated Slide Dots Pill */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-4 sm:mb-6">
            <div
              key={`badge-${currentBanner}`}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/18 backdrop-blur-md border border-white/30 text-[11px] sm:text-xs font-extrabold text-white shadow-sm animate-fade-in"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="truncate max-w-[290px] sm:max-w-none">{BANNERS[currentBanner].badge}</span>
            </div>

            {/* Elevated Slide Dot Indicators */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/15 border border-white/20 backdrop-blur-md shadow-xs">
              {BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToBanner(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${idx === currentBanner
                    ? 'w-6 h-2 bg-white shadow-sm'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Slide Headline */}
          <h1
            key={`h1-${currentBanner}`}
            className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] max-w-4xl mx-auto mb-3 sm:mb-5 drop-shadow-md"
          >
            {BANNERS[currentBanner].title.split('World-Class Universities').length > 1 ? (
              <>
                The Operating System for{' '}
                <span className="underline underline-offset-4 decoration-white/50 decoration-2">
                  World-Class Universities
                </span>
              </>
            ) : (
              <>
                {BANNERS[currentBanner].title}
              </>
            )}
          </h1>

          {/* Slide Subtitle */}
          <p
            key={`sub-${currentBanner}`}
            className="text-xs sm:text-base lg:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed mb-6 sm:mb-8 drop-shadow-xs px-2"
          >
            {BANNERS[currentBanner].subtitle}
          </p>

          {/* ─── LIVE TENANT SEARCH BAR */}
          {/* <div className="w-full max-w-2xl mx-auto relative z-50 px-1">
            <div className="bg-white rounded-[18px] sm:rounded-[22px] p-1.5 sm:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/40 flex items-center gap-1.5 sm:gap-2 focus-within:ring-4 focus-within:ring-white/40 transition-all">
              <div className="pl-2 sm:pl-3 text-[#EA580C] text-base sm:text-lg font-black shrink-0">🔍</div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search college or campus tenant (e.g. SRMS CET, IMS...)"
                className="w-full py-1.5 sm:py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-semibold bg-transparent min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-1.5 text-xs font-bold text-[#94A3B8] hover:text-[#0F172A]"
                >
                  ✕
                </button>
              )}
              <Link
                href="/login"
                className="px-4 py-2 sm:px-6 sm:py-3 rounded-[14px] sm:rounded-[16px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-[11px] sm:text-xs shadow-md transition-all shrink-0 cursor-pointer whitespace-nowrap"
              >
                <span>Find Campus ➔</span>
              </Link>
            </div>

            {isSearchFocused && quickMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[20px] shadow-[0_25px_70px_rgba(0,0,0,0.45)] border border-[#E2E8F0] overflow-hidden text-left z-[60] p-2 divide-y divide-[#F8FAFC] max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#94A3B8]">
                  Matching Campus Tenants
                </div>
                {quickMatches.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/login?college=${item.slug}`}
                    className="flex items-center justify-between p-3 hover:bg-[#FFF8F4] rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {item.logo_url ? (
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] p-1 flex items-center justify-center shrink-0 shadow-sm">
                          <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <span className="text-2xl">{item.icon || '🏛️'}</span>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#0F172A] group-hover:text-[#F36C21] transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-[#64748B]">{item.type} • <span className="font-mono text-[#F36C21]">{item.slug}</span></p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold text-[#F36C21] bg-[#FFF5ED] border border-[#FBE0D0] group-hover:bg-[#F36C21] group-hover:text-white transition-all">
                      Select & Login ➔
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div> */}
        </div>

        {/* ── STATS STRIP pinned to bottom */}
        <div className="relative z-20 pb-4 sm:pb-6 px-3 sm:px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/20 rounded-[18px] sm:rounded-[20px] overflow-hidden backdrop-blur-xl border border-white/25 shadow-xl">
              {[
                { value: '50,000+', label: 'Active Students & Doctors', color: 'text-white' },
                { value: '100%', label: 'AI-Powered Operations', color: 'text-amber-200' },
                { value: 'NMC & AICTE', label: 'Compliance Architecture', color: 'text-white' },
                { value: '99.99%', label: 'Cloud High-Availability', color: 'text-emerald-200' },
              ].map(({ value, label, color }, i) => (
                <div key={i} className="text-center px-2 py-3.5 sm:px-4 sm:py-5 bg-black/15 backdrop-blur-md space-y-0.5 sm:space-y-1">
                  <div className={`text-base sm:text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-[9px] sm:text-[11px] font-extrabold text-white/90 uppercase tracking-wider leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ─── 4. INTERACTIVE PRODUCT SUITE (AI-POWERED TABS) ─────────────────── */}
      <section id="solutions" className="py-20 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[#FFF5ED] border border-[#FBE0D0] text-[#F36C21] text-xs font-black uppercase tracking-wider">
              ENTERPRISE EDTECH SUITE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              One Cloud OS, Specialized for Every College
            </h2>
            <p className="text-sm text-[#64748B] font-medium leading-relaxed">
              Experience the power of an ERP built with domain-specific engines for medical schools, engineering campuses, and enterprise university administration.
            </p>

            {/* Interactive Tabs */}
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'ai'
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
              >
                🤖 AI Intelligence Core
              </button>
              <button
                onClick={() => setActiveTab('med')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'med'
                  ? 'bg-[#00C48C] text-white shadow-md'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
              >
                🏥 MED ERP (Medical Edition)
              </button>
              <button
                onClick={() => setActiveTab('nonmed')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'nonmed'
                  ? 'bg-[#5B4BFF] text-white shadow-md'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
              >
                ⚙️ Engineering & Higher Ed
              </button>
              <button
                onClick={() => setActiveTab('mobile')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${activeTab === 'mobile'
                  ? 'bg-[#F36C21] text-white shadow-md'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
              >
                📱 Mobile Apps Ecosystem
              </button>
            </div>
          </div>

          {/* Tab Content 1: AI Intelligence Core */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-8 rounded-[26px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm space-y-4 hover:border-[#F36C21]/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F36C21] flex items-center justify-center text-2xl font-bold">
                  ⚡
                </div>
                <h3 className="text-lg font-black text-[#0F172A]">AI Timetable Conflict Resolution</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Automatic conflict-free scheduling engine for lectures, labs, clinical postings, and visiting faculty rosters across multi-building campuses.
                </p>
                <div className="pt-2 text-[11px] font-bold text-[#F36C21]">99.8% Zero Scheduling Clashes ➔</div>
              </div>

              <div className="p-8 rounded-[26px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm space-y-4 hover:border-[#5B4BFF]/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#5B4BFF] flex items-center justify-center text-2xl font-bold">
                  📊
                </div>
                <h3 className="text-lg font-black text-[#0F172A]">Predictive Student Analytics</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Early alert systems for attendance shortages, clinical case log shortfalls, and examination preparedness with automatic parent SMS/WhatsApp triggers.
                </p>
                <div className="pt-2 text-[11px] font-bold text-[#5B4BFF]">Real-Time Student Health Index ➔</div>
              </div>

              <div className="p-8 rounded-[26px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm space-y-4 hover:border-[#00C48C]/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00C48C] flex items-center justify-center text-2xl font-bold">
                  🛡️
                </div>
                <h3 className="text-lg font-black text-[#0F172A]">Autonomous Academic Repositories</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Decentralized project and research indexing. Deduplicates theses, capstone projects, and clinical publications with tamper-proof audit trails.
                </p>
                <div className="pt-2 text-[11px] font-bold text-[#00C48C]">Smart Digital Project Archive ➔</div>
              </div>
            </div>
          )}

          {/* Tab Content 2: MED ERP */}
          {activeTab === 'med' && (
            <div id="med-ai" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                  🏥 NMC & DCI COMPLIANT ARCHITECTURE
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight">
                  UniCampus MED: Built for Medical Colleges & Teaching Hospitals
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Standard university ERPs break when dealing with medical curricula. UniCampus MED is architected natively around Professional Phases (Prof-I to Prof-IV), clinical bed rotations, OT rosters, and hospital shift biometrics.
                </p>
                <div className="space-y-3 text-xs font-bold text-[#334155]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
                    <span>Professional Phase Based Curriculum (MBBS, MD/MS, Super Specialty)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
                    <span>Clinical Postings, Bed Allocation & Patient Logbook Portals</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
                    <span>Doctor Duty Rosters & Hospital Shift Biometric Attendance</span>
                  </div>
                </div>
                <Link
                  href="/login?college=srms-ims"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  <span>Launch Medical Campus Login</span>
                  <span>➔</span>
                </Link>
              </div>

              <div className="p-8 rounded-[30px] bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <span className="text-xs font-black text-emerald-900">SRMS IMS CLINICAL PORTAL</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">LIVE NMC SYNC</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">MBBS Professional Phase III</span>
                    <span className="font-mono text-emerald-600 font-bold">150 Students</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">Clinical Posting: Surgery & Orthopedics</span>
                    <span className="font-mono text-blue-600 font-bold">950 Beds Active</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">Medical Thesis & Case Registry</span>
                    <span className="font-mono text-purple-600 font-bold">100% Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Engineering ERP */}
          {activeTab === 'nonmed' && (
            <div id="eng-ai" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-[#5B4BFF] text-xs font-black">
                  ⚙️ AICTE, NBA & UGC ACCREDITATION READY
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight">
                  UniCampus Technical & Engineering ERP
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Tailored for Engineering, Technology, Management, and Pharmacy institutions with Outcome-Based Education (OBE), credit scoring, lab workspaces, and integrated placement portals.
                </p>
                <div className="space-y-3 text-xs font-bold text-[#334155]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-[#5B4BFF] flex items-center justify-center text-[10px]">✓</span>
                    <span>Semester & Credit Curriculum with Continuous Internal Evaluation (CIE)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-[#5B4BFF] flex items-center justify-center text-[10px]">✓</span>
                    <span>Capstone Engineering Projects & Innovation Repositories</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-[#5B4BFF] flex items-center justify-center text-[10px]">✓</span>
                    <span>Placement Cell, Corporate Drives & Resume Builder Portals</span>
                  </div>
                </div>
                <Link
                  href="/login?college=srms-cet-bareilly"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#5B4BFF] hover:bg-[#4a39f0] text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all"
                >
                  <span>Launch Engineering Campus Login</span>
                  <span>➔</span>
                </Link>
              </div>

              <div className="p-8 rounded-[30px] bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                  <span className="text-xs font-black text-indigo-900">SRMS CET ENGINEERING PORTAL</span>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">AICTE APPROVED</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">B.Tech Computer Science & AI</span>
                    <span className="font-mono text-indigo-600 font-bold">NBA Accredited</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">Campus Placement Drives</span>
                    <span className="font-mono text-emerald-600 font-bold">100% Drive Sync</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-xs flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">Engineering Capstone Repos</span>
                    <span className="font-mono text-[#F36C21] font-bold">9 Active Projects</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Mobile Apps */}
          {activeTab === 'mobile' && (
            <div id="mobile-app" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F36C21] text-xs font-black">
                  📱 NATIVE IOS & ANDROID APPS
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight">
                  UniCampus Mobile: University in the Palm of Your Hand
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Real-time mobile companion apps for students, faculty, and college administrators with live attendance push notifications, timetables, assignment turn-ins, and digital student IDs.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-xl mb-1">📲</div>
                    <div className="font-bold text-xs text-[#0F172A]">Push Alerts</div>
                    <div className="text-[11px] text-[#64748B]">Instant exam & fee alerts</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-xl mb-1">🪪</div>
                    <div className="font-bold text-xs text-[#0F172A]">Digital ID Card</div>
                    <div className="text-[11px] text-[#64748B]">NFC gate & library pass</div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[30px] bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md p-2 mx-auto flex items-center justify-center">
                  <Image src="/unicampus-icon.png" alt="UniCampus App" width={48} height={48} className="object-contain" />
                </div>
                <h4 className="font-black text-base text-[#0F172A]">UniCampus Mobile App Suite</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Available for students, doctors, faculty, and administrative staff across all verified tenants.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F36C21] text-white font-extrabold text-xs shadow-md shadow-orange-500/20"
                  >
                    <span>Open Web App Portal</span>
                    <span>➔</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>



      {/* ─── 6. LIGHT LUXURY FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E2E8F0] py-14 text-[#475569]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#E2E8F0] p-1 shadow-sm flex items-center justify-center">
                <Image
                  src="/unicampus-icon.png"
                  alt="UniCampus"
                  width={34}
                  height={34}
                  className="object-contain"
                />
              </div>
              <div>
                <h4 className="font-black text-base text-[#0F172A]">UniCampus Cloud OS</h4>
                <p className="text-xs text-[#64748B]">
                  Autonomous Multi-Tenant University ERP & Intelligent Mobile Operating System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-bold text-[#334155]">
              <Link href="/login" className="hover:text-[#F36C21] transition-colors">
                Institutional Login
              </Link>
              <Link href="/access/superadmin" className="hover:text-[#F36C21] transition-colors">
                SuperAdmin
              </Link>
              <a href="#solutions" className="hover:text-[#F36C21] transition-colors">
                AI Solutions
              </a>
            </div>
          </div>

          <div className="border-t border-[#F1F5F9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8] font-medium">
            <p>© {new Date().getFullYear()} UniCampus AI Cloud Technologies. All rights reserved.</p>
            <p className="flex items-center gap-2 text-[#475569] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
              <span>Enterprise Cloud Security & AI Automation Active</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
