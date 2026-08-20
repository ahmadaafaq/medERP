'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  FolderGit2, 
  Linkedin, 
  Users, 
  Building2, 
  BookOpen, 
  Mail, 
  Phone, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface FacultyProfile {
  id?: string;
  name?: string;
  emp_id?: string;
  photo_url?: string;
  cover_url?: string;
  designation?: string;
  specialization?: string;
  department_name?: string;
  college_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  qualification?: string;
  experience?: string;
  joining_date?: string;
  linkedin_url?: string;
  linkedin_connections?: string | number;
  repository_evaluated_count?: number;
  followers_count?: number;
  assigned_courses?: string[];
  research_interests?: string[];
}

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const storedRole = typeof window !== 'undefined' ? (localStorage.getItem('role') || '').toUpperCase() : '';

    if (storedRole === 'STUDENT') {
      window.location.href = '/dashboard/student/profile';
      return;
    }

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

        if (meData.role === 'STUDENT' || (meData.role && meData.role.toUpperCase() === 'STUDENT')) {
          window.location.href = '/dashboard/student/profile';
          return;
        }

        const p = meData.profile || meData;
        const isEng = slug.includes('cet') || slug.includes('eng');
        const defaultDept = isEng ? 'Computer Science & Engineering' : 'Department of Physiology';
        const defaultSpec = isEng ? 'Software Engineering & AI Architecture' : 'Human Physiology & Neurobiology';
        const defaultQual = isEng ? 'M.Tech (CSE), Ph.D.' : 'MD (Physiology), MBBS';

        const name = p.name || meData.name || (isEng ? 'Dr. Shorab Ahmad' : 'Dr. Sanjay Singh');
        const emp_id = p.emp_id || p.empId || meData.empId || (isEng ? 'FAC/CET/102' : 'DR/07/026');
        const photo_url = p.photo_url || p.photoUrl || meData.photo_url || meData.photoUrl || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : name.includes('Aparna') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png');
        const designation = p.designation || meData.designation || 'Associate Professor & Mentor';
        const specialization = p.specialization || meData.specialization || defaultSpec;
        const department_name = p.department_name || meData.departmentName || defaultDept;
        const email = meData.email || p.email || (isEng ? 'shorab.ahmad@srms.ac.in' : 'sanjay.singh@srms.edu');
        const college_name = meData.collegeName || meData.tenantName || (isEng ? 'SRMS College of Engineering & Technology, Bareilly' : 'SRMS Institute of Medical Sciences');

        setProfile({
          id: p.id || meData.id || '1',
          name,
          emp_id,
          photo_url,
          cover_url: p.cover_url || meData.coverUrl || '/campus-cover.png',
          designation,
          specialization,
          department_name,
          college_name,
          email,
          phone: p.phone || meData.phone || '+91 98765 43210',
          gender: p.gender || meData.gender || (name.includes('Sarah') || name.includes('Aparna') ? 'Female' : 'Male'),
          qualification: p.qualification || meData.qualification || defaultQual,
          experience: p.experience || meData.experience || '12 Years Teaching & Research',
          joining_date: p.joining_date || meData.joining_date || '2015-07-15',
          linkedin_url: p.linkedin_url || meData.linkedin_url || 'https://www.linkedin.com/in/srms-faculty',
          linkedin_connections: p.linkedin_connections || '1,420',
          repository_evaluated_count: p.repository_evaluated_count || meData.repoCount || 18,
          followers_count: p.followers_count || meData.followersCount || 384,
          assigned_courses: isEng 
            ? ['BCA 3rd Sem — Object Oriented Programming in C++', 'B.Tech CSE 5th Sem — Software Engineering', 'BCA 5th Sem — Front End Dev']
            : ['MBBS Phase 1 — Physiology Theory & Practical', 'MD Physiology — Applied Neurobiology'],
          research_interests: isEng
            ? ['Machine Learning & NLP', 'Multi-Tenant Microservices', 'Distributed Systems']
            : ['Cardiovascular Dynamics', 'Autonomic Nervous System', 'Clinical Neurophysiology'],
        });
      } else {
        loadFallbackFromStorage();
      }
    } catch (err) {
      console.error('Failed to fetch faculty profile:', err);
      loadFallbackFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackFromStorage = () => {
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let cached: any = null;
    try { cached = cachedUserStr ? JSON.parse(cachedUserStr) : null; } catch {}
    let cp = cached?.profile || cached || {};
    const isEng = slug.includes('cet') || slug.includes('eng');
    const name = cp.name || cached?.name || (isEng ? 'Dr. Shorab Ahmad' : 'Dr. Sanjay Singh');

    setProfile({
      id: cp.id || '1',
      name,
      emp_id: cp.emp_id || cp.empId || cached?.empId || (isEng ? 'FAC/CET/102' : 'DR/07/026'),
      photo_url: cp.photo_url || cp.photoUrl || cached?.photo_url || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png'),
      cover_url: '/campus-cover.png',
      designation: cp.designation || cached?.designation || 'Associate Professor & Mentor',
      specialization: cp.specialization || cached?.specialization || (isEng ? 'Software Engineering & AI Architecture' : 'Human Physiology & Neurobiology'),
      department_name: cp.department_name || cached?.departmentName || (isEng ? 'Computer Science & Engineering' : 'Department of Physiology'),
      college_name: isEng ? 'SRMS College of Engineering & Technology, Bareilly' : 'SRMS Institute of Medical Sciences',
      email: cached?.email || cp.email || (isEng ? 'shorab.ahmad@srms.ac.in' : 'sanjay.singh@srms.edu'),
      phone: cp.phone || '+91 98765 43210',
      gender: cp.gender || 'Male',
      qualification: cp.qualification || (isEng ? 'M.Tech (CSE), Ph.D.' : 'MD (Physiology), MBBS'),
      experience: cp.experience || '12 Years Teaching & Research',
      joining_date: cp.joining_date || '2015-07-15',
      linkedin_url: 'https://www.linkedin.com/in/srms-faculty',
      linkedin_connections: '1,420',
      repository_evaluated_count: 18,
      followers_count: 384,
      assigned_courses: isEng 
        ? ['BCA 3rd Sem — Object Oriented Programming in C++', 'B.Tech CSE 5th Sem — Software Engineering', 'BCA 5th Sem — Front End Dev']
        : ['MBBS Phase 1 — Physiology Theory & Practical', 'MD Physiology — Applied Neurobiology'],
      research_interests: isEng
        ? ['Machine Learning & NLP', 'Multi-Tenant Microservices', 'Distributed Systems']
        : ['Cardiovascular Dynamics', 'Autonomic Nervous System', 'Clinical Neurophysiology'],
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Faculty Profile &amp; Mentorship Ledger — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading Faculty Profile...
            </div>
          ) : (
            <div className="space-y-6">
              {/* First Card: Cover Photo & Profile Banner Card */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden transition-all duration-300">
                {/* Campus Cover Banner Container */}
                <div className="relative h-48 sm:h-56 w-full bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] overflow-hidden">
                  <img
                    src={profile?.cover_url || '/campus-cover.png'}
                    alt="Campus Cover"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-[#2D2575]/20 mix-blend-multiply" />

                  {/* Cover Photo Floating Campus Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
                      <Building2 className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{profile?.college_name || 'SRMS CET, Bareilly'}</span>
                    </div>
                  </div>
                </div>

                {/* Profile Card Body & Stats Header */}
                <div className="p-6 pt-0 relative">
                  <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 -mt-14 sm:-mt-16 mb-2">
                    
                    {/* Left: Avatar & Primary Faculty Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                      <div className="relative group shrink-0">
                        {profile?.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.name || 'Faculty'}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] flex items-center justify-center text-3xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-slate-900">
                            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'F'}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00C48C] ring-2 ring-white dark:ring-slate-900" title="Active Faculty & Mentor" />
                      </div>

                      <div className="space-y-1.5 pb-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                            {profile?.name}
                          </h2>
                          <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                            EMP ID: {profile?.emp_id}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#4E5969] dark:text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                          <span>{profile?.designation}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>{profile?.department_name}</span>
                        </p>
                        <p className="text-xs text-[#00C48C] font-black flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse"></span>
                          <span>Verified Academic Mentor &amp; Evaluator</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: 3 Key Metrics Cards (1. Repository, 2. LinkedIn, 3. Followers) */}
                    <div className="w-full lg:w-auto bg-[#F6F8FC] dark:bg-slate-800/70 border border-[#E7EAF3] dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-around sm:justify-start gap-4 sm:gap-6 mt-2 lg:mt-0">
                      
                      {/* 1. Repository Evaluated */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#5B4BFF] mb-1">
                          <FolderGit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.repository_evaluated_count ?? 18}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                          Repository
                        </span>
                      </div>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 2. LinkedIn */}
                      <a
                        href={profile?.linkedin_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-center px-2 sm:px-3 group cursor-pointer hover:opacity-90 transition-opacity"
                        title="View Faculty LinkedIn Profile"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-[#0A66C2] mb-1">
                          <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform fill-[#0A66C2]" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.linkedin_connections ?? '1.4k'}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0A66C2] flex items-center justify-center gap-1">
                          <span>LinkedIn</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 3. Followers */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#F36C21] mb-1">
                          <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.followers_count ?? 384}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                          Followers
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Faculty Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Academic & Professional Details Card */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Academic &amp; Professional Details</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Employee Code</span>
                      <span className="font-mono font-black text-[#1B1E28] dark:text-slate-200">{profile?.emp_id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Academic Designation</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.designation}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Specialization / Domain</span>
                      <span className="font-bold text-[#5B4BFF] dark:text-indigo-300">{profile?.specialization}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Highest Qualification</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.qualification}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Teaching &amp; Industry Exp</span>
                      <span className="font-mono font-bold text-[#00C48C]">{profile?.experience}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Date of Joining</span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.joining_date}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Department Information Card */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Contact &amp; Campus Information</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Department</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.department_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Campus Location</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.college_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Official Email</span>
                      <span className="font-mono font-bold text-[#5B4BFF]">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Contact Phone</span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Gender</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.gender}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">LinkedIn Network</span>
                      <a 
                        href={profile?.linkedin_url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono font-bold text-[#0A66C2] hover:underline flex items-center gap-1"
                      >
                        <span>{profile?.linkedin_connections} Connections</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* Assigned Teaching Courses & Research Interests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Assigned Courses */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-3">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Assigned Teaching Courses &amp; Load</span>
                  </h3>
                  <div className="space-y-2">
                    {profile?.assigned_courses?.map((course, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-[#F6F8FC] dark:bg-slate-800/70 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1B1E28] dark:text-white flex items-center justify-between"
                      >
                        <span>{course}</span>
                        <span className="px-2 py-0.5 rounded bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-300 font-extrabold text-[10px]">
                          Active Load
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Research Interests */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-3">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F36C21]" />
                    <span>Research Interests &amp; Mentorship Domains</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile?.research_interests?.map((domain, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF4EC] dark:bg-slate-800 text-[#F36C21] dark:text-orange-400 border border-[#F36C21]/20 font-bold text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{domain}</span>
                      </span>
                    ))}
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

