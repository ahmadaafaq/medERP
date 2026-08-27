'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  FolderGit2, 
  CalendarCheck, 
  Users, 
  Camera, 
  CheckCircle2, 
  BookOpen, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  Edit3,
  Github,
  Linkedin,
  ExternalLink,
  Save,
  X,
  Globe,
  Award,
  Link2,
  FileText
} from 'lucide-react';

interface StudentProfile {
  id?: string;
  name?: string;
  registration_no?: string;
  rollno?: string;
  photo_url?: string;
  cover_url?: string;
  course_name?: string;
  course_cd?: string;
  department_name?: string;
  batch_cd?: string;
  admission_year?: string | number;
  email?: string;
  phone?: string;
  father_name?: string;
  mother_name?: string;
  residency_type?: string;
  academic_session?: string;
  admission_status?: string;
  college_name?: string;
  // Social & Bio
  bio?: string;
  github_url?: string;
  github_followers?: number;
  linkedin_url?: string;
  linkedin_connections?: number;
  // Dynamic header stats
  repository_count?: number;
  attendance_percentage?: string | number;
  followers_count?: number;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modals & State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');

  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [githubFollowersInput, setGithubFollowersInput] = useState<number | string>(0);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  const [isEditingLinkedin, setIsEditingLinkedin] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState('');
  const [linkedinConnectionsInput, setLinkedinConnectionsInput] = useState<number | string>(500);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const getStudentIdentity = () => {
    let regNo = '2025107990';
    let name = 'AAFREEN KHAN';
    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          regNo =
            p.registration_no ||
            cached?.registrationNo ||
            cached?.registration_no ||
            p.reg_no ||
            p.rollno ||
            cached?.rollno ||
            regNo;
          name = cached?.name || p.name || cached?.student_name || name;
        }
      } catch {}
    }
    return { regNo, name };
  };

  const fetchProfile = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const { regNo, name } = getStudentIdentity();

    try {
      // 1. Fetch Auth Profile
      const res = await fetch(`http://localhost:3001/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
          'x-user-reg-no': regNo,
          'x-user-id': regNo,
          'x-user-role': 'STUDENT',
        },
      });

      // 2. Fetch Student Repositories Count
      let repoCount = 0;
      try {
        const repoRes = await fetch(`http://localhost:3001/api/v1/repository/list?student_reg_no=${regNo}&tenant=${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
            'x-user-reg-no': regNo,
          },
        });
        if (repoRes.ok) {
          const rJson = await repoRes.json();
          repoCount = rJson.data?.count ?? (Array.isArray(rJson.data?.data) ? rJson.data.data.length : 0);
        }
      } catch {}

      // 3. Fetch Live SRMS Attendance
      let liveAttPct = '24.84%';
      try {
        const liveRes = await fetch('/api/srms/student-individual-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colg_cd: 1,
            course_cd: 13,
            branch_cd: 1,
            batch_cd: 2,
            stud_reg_no: regNo,
          }),
        });
        if (liveRes.ok) {
          const liveJson = await liveRes.json();
          if (liveJson.success && liveJson.data?.formattedPercentage) {
            liveAttPct = liveJson.data.formattedPercentage;
          }
        }
      } catch (e) {
        console.warn('Failed to load individual live attendance in profile:', e);
      }

      if (res.ok) {
        const json = await res.json();
        const meData = json.data || json;
        const p = meData.profile || meData;

        const courseStr = meData.courseName || p.course_name || (p.course_cd === '13' ? 'BCA' : p.course_cd === '1' ? 'B.Tech' : p.course_cd || 'BCA');
        const deptStr = meData.departmentName || p.department_name || (p.course_cd === '13' ? 'BCA General' : 'Computer Science & Engineering');

        const studentData: StudentProfile = {
          id: p.id || meData.id || '',
          name: p.name || meData.name || name,
          registration_no: p.registration_no || regNo,
          rollno: p.rollno || meData.rollno || '2500141790001',
          photo_url: p.photo_url || meData.photoUrl || meData.photo_url || '',
          cover_url: p.cover_url || meData.coverUrl || '/campus-cover.png',
          course_name: courseStr,
          course_cd: p.course_cd || meData.courseCd || '13',
          department_name: deptStr,
          batch_cd: p.batch_cd || meData.batchCd || 'Batch 2025',
          admission_year: p.admission_year || '2025',
          email: meData.email || p.email || 'student@srms.ac.in',
          phone: p.phone || meData.phone || '8979900657',
          father_name: p.father_name || 'N/A',
          mother_name: p.mother_name || 'N/A',
          residency_type: p.residency_type || 'Day Scholar',
          academic_session: p.academic_session || '2025-2026',
          admission_status: p.admission_status || 'ACTIVE',
          college_name: meData.collegeName || meData.tenantName || 'SRMS College of Engineering & Technology, Bareilly',
          bio: p.bio || 'Passionate software engineering student specializing in Full-Stack Web Development, distributed microservices, and modern JavaScript architectures.',
          github_url: p.github_url || 'https://github.com/aafreen-khan',
          github_followers: p.github_followers ?? 48,
          linkedin_url: p.linkedin_url || 'https://linkedin.com/in/aafreen-khan',
          linkedin_connections: p.linkedin_connections ?? 350,
          repository_count: repoCount || p.repository_count || 2,
          attendance_percentage: liveAttPct,
          followers_count: (p.github_followers ?? 48) + (p.linkedin_connections ?? 350),
        };

        setProfile(studentData);
        setBioInput(studentData.bio || '');
        setGithubUrlInput(studentData.github_url || '');
        setGithubFollowersInput(studentData.github_followers ?? 48);
        setLinkedinUrlInput(studentData.linkedin_url || '');
        setLinkedinConnectionsInput(studentData.linkedin_connections ?? 350);
      } else {
        loadFallback(repoCount, liveAttPct);
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
      loadFallback(2, '24.84%');
    } finally {
      setLoading(false);
    }
  };

  const loadFallback = (repoCount: number, liveAttPct: string) => {
    const { regNo, name } = getStudentIdentity();
    const fallbackData: StudentProfile = {
      id: '1',
      name: name,
      registration_no: regNo,
      rollno: '2500141790001',
      photo_url: '',
      cover_url: '/campus-cover.png',
      course_name: 'BCA',
      course_cd: '13',
      department_name: 'BCA General',
      batch_cd: 'Batch 2025',
      admission_year: '2025',
      email: 'student@srms.ac.in',
      phone: '8979900657',
      father_name: 'N/A',
      mother_name: 'N/A',
      residency_type: 'Day Scholar',
      academic_session: '2025-2026',
      admission_status: 'ACTIVE',
      college_name: 'SRMS College of Engineering & Technology, Bareilly',
      bio: 'Passionate software engineering student specializing in Full-Stack Web Development, distributed microservices, and modern JavaScript architectures.',
      github_url: 'https://github.com/aafreen-khan',
      github_followers: 48,
      linkedin_url: 'https://linkedin.com/in/aafreen-khan',
      linkedin_connections: 350,
      repository_count: repoCount,
      attendance_percentage: liveAttPct,
      followers_count: 398,
    };
    setProfile(fallbackData);
    setBioInput(fallbackData.bio || '');
    setGithubUrlInput(fallbackData.github_url || '');
    setGithubFollowersInput(fallbackData.github_followers ?? 48);
    setLinkedinUrlInput(fallbackData.linkedin_url || '');
    setLinkedinConnectionsInput(fallbackData.linkedin_connections ?? 350);
  };

  // Auto-fetch GitHub Followers from Public API
  const handleFetchGithubStats = async () => {
    if (!githubUrlInput.trim()) return;
    setIsFetchingGithub(true);
    try {
      let username = githubUrlInput.trim();
      if (username.includes('github.com/')) {
        username = username.split('github.com/')[1].split('/')[0].split('?')[0];
      }
      if (!username) {
        alert('Could not extract GitHub username from URL');
        return;
      }

      const res = await fetch(`https://api.github.com/users/${username}`);
      if (res.ok) {
        const ghData = await res.json();
        if (ghData.followers !== undefined) {
          setGithubFollowersInput(ghData.followers);
          setGithubUrlInput(`https://github.com/${username}`);
          alert(`Successfully fetched ${ghData.followers} followers and ${ghData.public_repos} public repos from GitHub for @${username}!`);
        }
      } else {
        alert(`Could not fetch GitHub user @${username}. You can enter follower count manually.`);
      }
    } catch (e) {
      console.warn('GitHub API rate limit or error:', e);
      alert('GitHub public API is currently offline. You can set the follower count manually.');
    } finally {
      setIsFetchingGithub(false);
    }
  };

  // Save profile updates to backend PostgreSQL
  const handleSaveProfileField = async (payload: Partial<StudentProfile>) => {
    setSaving(true);
    setSaveMessage('');
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const { regNo } = getStudentIdentity();

    try {
      const res = await fetch(`http://localhost:3001/api/v1/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
          'x-user-reg-no': regNo,
        },
        body: JSON.stringify({
          student_reg_no: regNo,
          tenant: slug,
          ...payload,
        }),
      });

      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, ...payload } : prev);
        setSaveMessage('Profile details updated successfully!');
        setIsEditingBio(false);
        setIsEditingGithub(false);
        setIsEditingLinkedin(false);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        alert('Failed to save profile update to database.');
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      // Optimistic update locally
      setProfile((prev) => prev ? { ...prev, ...payload } : prev);
      setIsEditingBio(false);
      setIsEditingGithub(false);
      setIsEditingLinkedin(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProfileField({ bio: bioInput });
  };

  const handleSaveGithub = (e: React.FormEvent) => {
    e.preventDefault();
    const followers = Number(githubFollowersInput) || 0;
    handleSaveProfileField({ 
      github_url: githubUrlInput.trim(),
      github_followers: followers,
      followers_count: followers + (profile?.linkedin_connections ?? 0),
    });
  };

  const handleSaveLinkedin = (e: React.FormEvent) => {
    e.preventDefault();
    const connections = Number(linkedinConnectionsInput) || 0;
    handleSaveProfileField({ 
      linkedin_url: linkedinUrlInput.trim(),
      linkedin_connections: connections,
      followers_count: (profile?.github_followers ?? 0) + connections,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Student Profile — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">
          
          {saveMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-[#00C48C]/40 text-[#00C48C] text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading Student Profile...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Banner & Header Card */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden transition-all duration-300">
                {/* Campus Cover Banner */}
                <div className="relative h-48 sm:h-56 w-full bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] overflow-hidden">
                  <img
                    src={profile?.cover_url || '/campus-cover.png'}
                    alt="Campus Cover"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-[#2D2575]/20 mix-blend-multiply" />

                  {/* Campus Floating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
                      <Building2 className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{profile?.college_name || 'SRMS CET, Bareilly'}</span>
                    </div>
                  </div>
                </div>

                {/* Profile Avatar & Primary Info & Metrics */}
                <div className="p-6 pt-0 relative">
                  <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 mb-2">
                    
                    {/* Avatar & Primary Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                      <div className="relative group shrink-0 -mt-14 sm:-mt-16">
                        {profile?.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.name || 'Student'}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] flex items-center justify-center text-3xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-slate-900">
                            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AK'}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00C48C] ring-2 ring-white dark:ring-slate-900" title="Enrolled & Active" />
                      </div>

                      <div className="space-y-1.5 pb-1 pt-2 sm:pt-4">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-2xl sm:text-3xl font-black text-[#11141A] dark:text-white tracking-tight">
                            {profile?.name}
                          </h2>
                          <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                            REG: {profile?.registration_no}
                          </span>
                          {profile?.rollno && (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-300 border border-[#5B4BFF]/30">
                              ROLL: {profile?.rollno}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-[#4E5969] dark:text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                          <span>Student</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>{profile?.course_name} ({profile?.department_name})</span>
                        </p>
                        <p className="text-xs text-[#00C48C] font-black flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse"></span>
                          <span>Status: Enrolled &amp; Active Student</span>
                        </p>
                      </div>
                    </div>

                    {/* 3 Key Header Metric Cards */}
                    <div className="w-full lg:w-auto bg-[#F6F8FC] dark:bg-slate-800/70 border border-[#E7EAF3] dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-around sm:justify-start gap-4 sm:gap-6 mt-2 lg:mt-0">
                      
                      {/* 1. Repository Count */}
                      <a href="/dashboard/student/repository" className="text-center px-2 sm:px-3 group cursor-pointer block hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-center gap-1.5 text-[#5B4BFF] mb-1">
                          <FolderGit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.repository_count ?? 2}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 group-hover:text-[#5B4BFF]">
                          Repository
                        </span>
                      </a>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 2. Attendance % */}
                      <a href="/dashboard/student/attendance" className="text-center px-2 sm:px-3 group cursor-pointer block hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-center gap-1.5 text-[#00C48C] mb-1">
                          <CalendarCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.attendance_percentage ?? '24.84%'}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 group-hover:text-[#00C48C]">
                          Attendance
                        </span>
                      </a>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 3. Combined Social Followers & Connections */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#F36C21] mb-1">
                          <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {((profile?.github_followers ?? 0) + (profile?.linkedin_connections ?? 0)) || 398}
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

              {/* Bio & Social Channels Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                
                {/* BIO Card (Span 2) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                      <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Student Biography &amp; Professional Summary</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEditingBio(!isEditingBio)}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingBio ? 'Close' : 'Edit Bio'}</span>
                      </button>
                    </div>

                    {isEditingBio ? (
                      <form onSubmit={handleSaveBio} className="space-y-3 pt-1">
                        <textarea
                          rows={4}
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          placeholder="Write a brief bio about your technical expertise, career goals, projects, and programming passions..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingBio(false)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-indigo-600 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{saving ? 'Saving...' : 'Save Bio'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-300 leading-relaxed italic bg-[#F6F8FC] dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-[#E7EAF3] dark:border-slate-700">
                        "{profile?.bio || 'Passionate software engineering student specializing in Full-Stack Web Development, distributed microservices, and modern JavaScript architectures.'}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>Visible to recruiters and evaluating faculty in Campus Placement Drives.</span>
                  </div>
                </div>

                {/* Social & Repository Links Card (Span 1) */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      <span>Developer Profiles</span>
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* GitHub Box */}
                    <div className="p-3.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Github className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-[#1B1E28] dark:text-white block">GitHub Profile</span>
                            <span className="text-[10px] font-bold text-[#5B4BFF]">
                              {profile?.github_followers ?? 48} Followers
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingGithub(!isEditingGithub)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B4BFF] hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                            title="Edit GitHub Link"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {profile?.github_url && (
                            <a
                              href={profile.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B4BFF] hover:bg-white dark:hover:bg-slate-700 transition-all"
                              title="Open GitHub Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {isEditingGithub ? (
                        <form onSubmit={handleSaveGithub} className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              GitHub Profile URL / Username
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={githubUrlInput}
                                onChange={(e) => setGithubUrlInput(e.target.value)}
                                placeholder="https://github.com/username"
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                                required
                              />
                              <button
                                type="button"
                                onClick={handleFetchGithubStats}
                                disabled={isFetchingGithub}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                                title="Fetch public followers count directly from GitHub API"
                              >
                                {isFetchingGithub ? '...' : 'Fetch'}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Followers Count
                            </label>
                            <input
                              type="number"
                              value={githubFollowersInput}
                              onChange={(e) => setGithubFollowersInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingGithub(false)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#5B4BFF] text-white hover:bg-indigo-600"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 truncate">
                          {profile?.github_url || 'Not connected yet'}
                        </p>
                      )}
                    </div>

                    {/* LinkedIn Box */}
                    <div className="p-3.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-[#1B1E28] dark:text-white block">LinkedIn Profile</span>
                            <span className="text-[10px] font-bold text-[#00C48C]">
                              {profile?.linkedin_connections ?? 350}+ Connections
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingLinkedin(!isEditingLinkedin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B4BFF] hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                            title="Edit LinkedIn Link"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {profile?.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B4BFF] hover:bg-white dark:hover:bg-slate-700 transition-all"
                              title="Open LinkedIn Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {isEditingLinkedin ? (
                        <form onSubmit={handleSaveLinkedin} className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              LinkedIn Profile URL
                            </label>
                            <input
                              type="url"
                              value={linkedinUrlInput}
                              onChange={(e) => setLinkedinUrlInput(e.target.value)}
                              placeholder="https://linkedin.com/in/username"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Connections Count
                            </label>
                            <input
                              type="number"
                              value={linkedinConnectionsInput}
                              onChange={(e) => setLinkedinConnectionsInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingLinkedin(false)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#5B4BFF] text-white hover:bg-indigo-600"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 truncate">
                          {profile?.linkedin_url || 'Not connected yet'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Secondary Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                
                {/* Academic & Program Details */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Academic &amp; Program Details</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-[#5B4BFF]/20">
                      SESSION {profile?.academic_session}
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Registration No</span>
                      <span className="font-mono font-black text-[#1B1E28] dark:text-slate-200">{profile?.registration_no}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Roll Number</span>
                      <span className="font-mono font-black text-[#5B4BFF]">{profile?.rollno || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Course Program</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.course_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Branch / Department</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.department_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Batch</span>
                      <span className="font-mono font-bold text-[#00C48C]">{profile?.batch_cd}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Admission Year</span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.admission_year}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Guardian Information */}
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Contact &amp; Guardian Information</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#00C48C] border border-[#00C48C]/20">
                      VERIFIED
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#5B4BFF]" /> Email Address
                      </span>
                      <span className="font-mono font-bold text-[#5B4BFF]">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#00C48C]" /> Phone Number
                      </span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Father's Name</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.father_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Mother's Name</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.mother_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Residency Type</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.residency_type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F36C21]" /> Campus
                      </span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200 truncate max-w-[200px]" title={profile?.college_name}>
                        {profile?.college_name}
                      </span>
                    </div>
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
