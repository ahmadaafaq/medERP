'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import Link from 'next/link';
import { 
  FolderGit2, 
  Search, 
  Filter, 
  ExternalLink, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Rocket, 
  ArrowRight,
  User,
  Layers,
  GraduationCap,
  Calendar,
  Github,
  Check,
  AlertCircle,
  Eye,
  X,
  Maximize2,
  Building2,
  Briefcase,
  Target,
  Send,
  Zap
} from 'lucide-react';

interface ProjectRepo {
  repo_id: number;
  title: string;
  description: string;
  repo_link: string;
  tech_stack: string[];
  screenshots?: string[];
  student_reg_no: string;
  student_name: string;
  student_photo?: string;
  rollno?: string;
  course_cd: string;
  course_name?: string;
  branch_cd: string;
  branch_name?: string;
  batch_cd: string;
  batch_name?: string;
  sem_cd: string;
  status: string;
  score?: number;
  grade?: string;
  is_placement_eligible: boolean;
  incubation_status?: string;
  submitted_at: string;
  faculty_name?: string;
  faculty_photo?: string;
  faculty_designation?: string;
  faculty_remarks?: string;
  faculty_reviewed_at?: string;
}

const COMMON_COMPANY_SKILLS = [
  'Python', 'PyTorch', 'React', 'Next.js', 'FastAPI', 
  'Node.js', 'PostgreSQL', 'Docker', 'Solidity', 'C++', 
  'ROS2', 'ESP32', 'OpenCV', 'FPGA', 'Verilog'
];

export default function AdminRepositoryPage() {
  const [repositories, setRepositories] = useState<ProjectRepo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INCUBATED' | 'COMPANY_MATCH' | 'HIGH_SCORE' | 'GRADED' | 'PENDING'>('ALL');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [nominateMsg, setNominateMsg] = useState<string>('');
  const [nominatingId, setNominatingId] = useState<number | null>(null);
  
  // Image Preview Lightbox Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const getHeaders = () => {
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'x-tenant-slug': slug,
      'x-tenant': slug,
      'x-tenant-id': `tenant_${slug}`,
    };
  };

  const getTenantSlug = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/repository/list?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const rawData = json.data?.data || json.data || json;
        setRepositories(Array.isArray(rawData) ? rawData : []);
      }
    } catch (err) {
      console.error('Failed to fetch repositories for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNominateToIncubation = async (repoId: number, studentName: string) => {
    setNominatingId(repoId);
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/incubation-cell/projects/${repoId}/status?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'Selected',
          notes: 'Nominated directly from Academic Repository by College Administrator for Venture Incubation & Company Placement',
          tenant: slug,
        }),
      });

      if (res.ok) {
        setNominateMsg(`🚀 Project #${repoId} (${studentName}) successfully shortlisted for Incubation Cell! Golden celebration notification sent to Student & Faculty! 🎉`);
        setTimeout(() => setNominateMsg(''), 6000);
        fetchRepositories();
      } else {
        const err = await res.json();
        setNominateMsg(err.message || 'Status update completed.');
      }
    } catch (e) {
      console.error('Failed to nominate project:', e);
    } finally {
      setNominatingId(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Filtered Repositories Logic
  const filteredList = repositories.filter(repo => {
    const isIncubated = ['Selected', 'Incubated', 'Funded'].includes(repo.incubation_status || '');

    if (activeFilter === 'INCUBATED') {
      if (!isIncubated) return false;
    } else if (activeFilter === 'COMPANY_MATCH') {
      // In company match mode, show high scorers and filter by selected company skills
      if (selectedSkills.length > 0) {
        const repoTech = (repo.tech_stack || []).map(t => t.toLowerCase());
        const hasSkillMatch = selectedSkills.some(skill => 
          repoTech.some(t => t.includes(skill.toLowerCase()) || skill.toLowerCase().includes(t))
        );
        if (!hasSkillMatch) return false;
      }
    } else if (activeFilter === 'GRADED') {
      if (!repo.score && repo.status !== 'Reviewed') return false;
    } else if (activeFilter === 'HIGH_SCORE') {
      if (!repo.score || repo.score <= 70) return false;
    } else if (activeFilter === 'PENDING') {
      if (repo.status === 'Reviewed') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = repo.title?.toLowerCase().includes(q);
      const matchStudent = repo.student_name?.toLowerCase().includes(q);
      const matchReg = repo.student_reg_no?.toLowerCase().includes(q);
      const matchFaculty = repo.faculty_name?.toLowerCase().includes(q);
      const matchTech = repo.tech_stack?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchStudent && !matchReg && !matchFaculty && !matchTech) return false;
    }

    return true;
  });

  const highScoredCount = repositories.filter(r => (r.score || 0) > 70).length;
  const incubatedCount = repositories.filter(r => ['Selected', 'Incubated', 'Funded'].includes(r.incubation_status || '')).length;
  const gradedCount = repositories.filter(r => r.status === 'Reviewed' || !!r.score).length;
  const pendingCount = repositories.filter(r => r.status !== 'Reviewed' && !r.score).length;

  return (
    <div className="flex h-screen bg-[#F6F8FC] overflow-hidden font-sans">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Academic Project Repository — Admin Control" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#11141A] via-[#1E2638] to-[#11141A] border border-slate-800 rounded-[22px] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#F36C21]" />
                  <span>College Project Repository & Company Placement Matching</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight">Academic Project Repository 📂</h1>
                <p className="text-sm text-purple-100/90 max-w-2xl">
                  Inspect student submissions, view uploaded project screenshots, examine verified faculty marks, and match top incubated candidates with visiting corporate hiring companies.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveFilter('COMPANY_MATCH')}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md font-extrabold text-white text-xs transition-all flex items-center gap-2 border border-white/30 active:scale-95"
                >
                  <Briefcase className="w-4 h-4 text-amber-300" />
                  <span>Company Match 🏢</span>
                </button>

                <Link
                  href="/dashboard/admin/incubation-cell"
                  className="px-5 py-2.5 rounded-xl bg-[#F36C21] hover:bg-orange-600 font-extrabold text-white text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Incubation Cell 🚀</span>
                </Link>
              </div>
            </div>

            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Golden Celebration Alert Banner */}
          {nominateMsg && (
            <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 border-2 border-amber-300 text-amber-950 rounded-2xl text-xs font-extrabold flex items-center gap-3 shadow-md animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="leading-relaxed">{nominateMsg}</span>
            </div>
          )}

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div 
              onClick={() => setActiveFilter('ALL')}
              className={`p-4 rounded-[22px] border cursor-pointer transition-all ${
                activeFilter === 'ALL' 
                  ? 'bg-white border-[#5B4BFF] shadow-md ring-2 ring-[#5B4BFF]/20' 
                  : 'bg-white border-[#E7EAF3] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E5969]">All Projects</span>
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-[#1B1E28] mt-2">{repositories.length}</p>
              <p className="text-[10px] text-[#4E5969] mt-0.5">Total submissions</p>
            </div>

            <div 
              onClick={() => setActiveFilter('INCUBATED')}
              className={`p-4 rounded-[22px] border cursor-pointer transition-all ${
                activeFilter === 'INCUBATED' 
                  ? 'bg-white border-[#F36C21] shadow-md ring-2 ring-[#F36C21]/20' 
                  : 'bg-white border-[#E7EAF3] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E5969]">Incubated & Shortlisted</span>
                <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#F36C21] flex items-center justify-center">
                  <Rocket className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-[#F36C21] mt-2">{incubatedCount}</p>
              <p className="text-[10px] text-orange-600 font-bold mt-0.5">Venture selected 🚀</p>
            </div>

            <div 
              onClick={() => setActiveFilter('COMPANY_MATCH')}
              className={`p-4 rounded-[22px] border cursor-pointer transition-all ${
                activeFilter === 'COMPANY_MATCH' 
                  ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20' 
                  : 'bg-white border-[#E7EAF3] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E5969]">Company Match</span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-amber-600 mt-2">{highScoredCount}</p>
              <p className="text-[10px] text-amber-600 font-bold mt-0.5">Corporate pipeline 🏢</p>
            </div>

            <div 
              onClick={() => setActiveFilter('GRADED')}
              className={`p-4 rounded-[22px] border cursor-pointer transition-all ${
                activeFilter === 'GRADED' 
                  ? 'bg-white border-[#00C48C] shadow-md ring-2 ring-[#00C48C]/20' 
                  : 'bg-white border-[#E7EAF3] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E5969]">Faculty Graded</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#00C48C] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-[#00C48C] mt-2">{gradedCount}</p>
              <p className="text-[10px] text-[#4E5969] mt-0.5">Evaluated with score</p>
            </div>

            <div 
              onClick={() => setActiveFilter('PENDING')}
              className={`p-4 rounded-[22px] border cursor-pointer transition-all ${
                activeFilter === 'PENDING' 
                  ? 'bg-white border-[#FFB020] shadow-md ring-2 ring-[#FFB020]/20' 
                  : 'bg-white border-[#E7EAF3] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E5969]">Pending Review</span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-[#FFB020] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-black text-[#FFB020] mt-2">{pendingCount}</p>
              <p className="text-[10px] text-[#4E5969] mt-0.5">Awaiting evaluation</p>
            </div>
          </div>

          {/* Company Visiting Skill Matcher Bar (Active in COMPANY_MATCH Mode) */}
          {activeFilter === 'COMPANY_MATCH' && (
            <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-indigo-50/60 border-2 border-amber-300/80 rounded-[22px] p-5 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-[#1B1E28]">
                    🏢 Visiting Company Skills Matcher & Placement Screener
                  </h3>
                </div>
                <div className="text-xs font-bold text-amber-800">
                  {selectedSkills.length > 0 
                    ? `Filtering by ${selectedSkills.length} selected skill${selectedSkills.length > 1 ? 's' : ''}`
                    : 'Select required skill keywords to filter matching student projects'}
                </div>
              </div>

              {/* Quick skill selection pills */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-[#4E5969] uppercase tracking-wider">
                  Company Hiring Tech Stack Requirements:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COMPANY_SKILLS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          active
                            ? 'bg-[#5B4BFF] text-white shadow-sm ring-2 ring-[#5B4BFF]/30'
                            : 'bg-white border border-slate-200 text-[#4E5969] hover:bg-slate-100'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                  {selectedSkills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSkills([])}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Clear Skills ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Tabs */}
          <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search project title, student name, faculty name, tech..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-[#F36C21] text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                All Projects ({repositories.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('INCUBATED')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'INCUBATED'
                    ? 'bg-[#F36C21] text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                <span>Incubated 🚀</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{incubatedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('COMPANY_MATCH')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'COMPANY_MATCH'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Company Match</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('HIGH_SCORE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'HIGH_SCORE'
                    ? 'bg-[#5B4BFF] text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                <span>Score &gt; 70%</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{highScoredCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('GRADED')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'GRADED'
                    ? 'bg-[#00C48C] text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                Graded ({gradedCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('PENDING')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'PENDING'
                    ? 'bg-[#FFB020] text-white shadow-sm'
                    : 'bg-slate-100 text-[#4E5969] hover:bg-slate-200'
                }`}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* Project List */}
          {loading ? (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-12 text-center shadow-sm">
              <div className="w-10 h-10 border-4 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1B1E28]">Loading Academic Repositories...</p>
              <p className="text-xs text-[#4E5969] mt-1">Retrieving student submissions, uploaded screenshot previews, and faculty evaluation scores</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5B4BFF] flex items-center justify-center mx-auto mb-3">
                <FolderGit2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-[#1B1E28]">No Projects Found</h3>
              <p className="text-xs text-[#4E5969] mt-1 max-w-md mx-auto">
                No project repositories match the selected filter criteria. Try adjusting your search query, skill filters, or filter tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredList.map((repo) => {
                const scoreVal = repo.score !== undefined ? Number(repo.score) : null;
                const isHighScorer = scoreVal !== null && scoreVal >= 70;
                const isIncubated = ['Selected', 'Incubated', 'Funded'].includes(repo.incubation_status || '');
                const screenshots = Array.isArray(repo.screenshots) ? repo.screenshots : (repo.screenshots ? [repo.screenshots] : []);

                // Profile photo fallback
                const studentAvatar = repo.student_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(repo.student_name || 'Student')}&background=F36C21&color=fff&bold=true`;
                const facultyAvatar = repo.faculty_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(repo.faculty_name || 'Faculty Evaluator')}&background=5B4BFF&color=fff&bold=true`;

                // Skill match check
                const matchedSkills = selectedSkills.filter(sk => 
                  (repo.tech_stack || []).some(t => t.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(t.toLowerCase()))
                );

                return (
                  <div
                    key={repo.repo_id}
                    className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Right Highlight Pill */}
                    {isIncubated ? (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <Rocket className="w-3 h-3 text-amber-300" />
                        <span>INCUBATED & SHORTLISTED</span>
                      </div>
                    ) : isHighScorer ? (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-[#F36C21] to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>INCUBATION READY</span>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {/* Student Profile & Academic Meta Header */}
                      <div className="flex items-center gap-3.5 pr-28">
                        <div className="relative">
                          <img
                            src={studentAvatar}
                            alt={repo.student_name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-[#5B4BFF]/20 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(repo.student_name)}&background=F36C21&color=fff&bold=true`;
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-[#1B1E28] uppercase truncate">{repo.student_name}</h4>
                          <p className="text-[11px] text-[#4E5969] font-medium flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="font-bold text-[#5B4BFF]">{repo.course_name || 'B.Tech'}</span>
                            <span>•</span>
                            <span className="truncate">{repo.branch_name || 'CSE'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-500">{repo.batch_name || 'Batch 2025'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Reg: {repo.student_reg_no}</p>
                        </div>
                      </div>

                      {/* Project Title & Description */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-[#1B1E28] group-hover:text-[#5B4BFF] transition-colors line-clamp-1">
                          {repo.title}
                        </h3>
                        <p className="text-xs text-[#4E5969] line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>
                      </div>

                      {/* Screenshots Gallery Section */}
                      {screenshots.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#1B1E28]">
                            <span>Project Screenshots ({screenshots.length})</span>
                            <span className="text-[10px] text-slate-400">Click to expand</span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {screenshots.map((imgUrl, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={() => setPreviewImage({ url: imgUrl, title: `${repo.title} — Screenshot #${sIdx + 1}` })}
                                className="relative w-28 h-18 rounded-xl overflow-hidden border border-[#E7EAF3] cursor-pointer group/img shrink-0 shadow-sm"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Screenshot ${sIdx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tech Stack Badges with Skill Matching Highlights */}
                      {repo.tech_stack && repo.tech_stack.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            {repo.tech_stack.map((tech, idx) => {
                              const isMatched = selectedSkills.some(sk => sk.toLowerCase() === tech.toLowerCase() || tech.toLowerCase().includes(sk.toLowerCase()));
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                    isMatched
                                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs font-black'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {tech} {isMatched && '🎯'}
                                </span>
                              );
                            })}
                          </div>
                          {activeFilter === 'COMPANY_MATCH' && matchedSkills.length > 0 && (
                            <p className="text-[10px] font-bold text-amber-700">
                              ✓ Matches {matchedSkills.length} visiting company criteria: {matchedSkills.join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Faculty Evaluation Score Card with Faculty Photo */}
                      {scoreVal !== null ? (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/60 to-white border border-purple-100/90 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                <Award className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-[#1B1E28] flex items-center gap-1.5">
                                  <span>Faculty Score:</span>
                                  <span className="text-[#5B4BFF] font-black text-sm">{scoreVal}%</span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-black border border-[#5B4BFF]/20">
                                    Grade: {repo.grade || 'A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Evaluated</span>
                            </span>
                          </div>

                          {/* Faculty Profile & Verified Remarks */}
                          <div className="flex items-start gap-3 pt-2 border-t border-purple-100/60">
                            <img
                              src={facultyAvatar}
                              alt={repo.faculty_name || 'Faculty Evaluator'}
                              className="w-9 h-9 rounded-xl object-cover border border-purple-200 shadow-sm shrink-0 mt-0.5"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(repo.faculty_name || 'Faculty')}&background=5B4BFF&color=fff&bold=true`;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-[#1B1E28] truncate">
                                  {repo.faculty_name || 'Prof. Faculty Evaluator'}
                                </h5>
                                {repo.faculty_reviewed_at && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(repo.faculty_reviewed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-purple-600 font-bold">
                                {repo.faculty_designation || 'Faculty Reviewer & Subject Guide'}
                              </p>
                              {repo.faculty_remarks && (
                                <p className="text-[11px] text-slate-700 italic bg-white/90 p-2.5 rounded-xl border border-purple-100 mt-1.5 leading-relaxed">
                                  "{repo.faculty_remarks}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800 font-bold flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Awaiting Faculty Grading & Assessment Evaluation</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 mt-3 border-t border-[#E7EAF3] flex items-center justify-between gap-2">
                      {repo.repo_link ? (
                        <a
                          href={repo.repo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Code Repository</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">No external link</span>
                      )}

                      {/* Transfer to Incubation Cell Button */}
                      {isIncubated ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Incubated ✓</span>
                        </span>
                      ) : isHighScorer ? (
                        <button
                          type="button"
                          disabled={nominatingId === repo.repo_id}
                          onClick={() => handleNominateToIncubation(repo.repo_id, repo.student_name)}
                          className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                          title="Transfer shortlisted project to Incubation Cell and notify student & faculty"
                        >
                          <Rocket className="w-3.5 h-3.5 text-[#F36C21]" />
                          <span>{nominatingId === repo.repo_id ? 'Incubating...' : 'Incubate 🚀'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                          Score &lt; 70%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Screenshot Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-[#1B1E28]">{previewImage.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
