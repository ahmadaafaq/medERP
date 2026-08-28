'use client';

import { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Edit3,
  Camera,
  Upload,
  X,
  Check,
  Save,
  Loader2,
  Trash2
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: '',
    qualification: '',
    specialization: '',
    experience: '',
    gender: 'Male',
    photo_url: '',
    cover_url: '',
    linkedin_url: '',
    linkedin_connections: '',
    research_interests_str: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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
      const res = await fetch(`http://localhost:8081/api/v1/auth/me`, {
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

        const researchList = Array.isArray(p.research_interests) && p.research_interests.length > 0 
          ? p.research_interests 
          : (isEng ? ['Machine Learning & NLP', 'Multi-Tenant Microservices', 'Distributed Systems'] : ['Cardiovascular Dynamics', 'Autonomic Nervous System', 'Clinical Neurophysiology']);

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
          repository_evaluated_count: p.repository_evaluated_count ?? meData.repoCount ?? 18,
          followers_count: p.followers_count ?? meData.followersCount ?? 384,
          assigned_courses: isEng 
            ? ['BCA 3rd Sem — Object Oriented Programming in C++', 'B.Tech CSE 5th Sem — Software Engineering', 'BCA 5th Sem — Front End Dev']
            : ['MBBS Phase 1 — Physiology Theory & Practical', 'MD Physiology — Applied Neurobiology'],
          research_interests: researchList,
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

  const handleOpenEditModal = () => {
    if (!profile) return;
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      designation: profile.designation || '',
      qualification: profile.qualification || '',
      specialization: profile.specialization || '',
      experience: profile.experience || '',
      gender: profile.gender || 'Male',
      photo_url: profile.photo_url || '',
      cover_url: profile.cover_url || '',
      linkedin_url: profile.linkedin_url || '',
      linkedin_connections: String(profile.linkedin_connections || '1,420'),
      research_interests_str: Array.isArray(profile.research_interests) ? profile.research_interests.join(', ') : '',
    });
    setPhotoPreview(profile.photo_url || null);
    setCoverPreview(profile.cover_url || null);
    setIsEditModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('error', 'Image size exceeds 3MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, photo_url: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Cover image size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCoverPreview(base64String);
        setFormData(prev => ({ ...prev, cover_url: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Full Name is required');
      return;
    }

    setSaving(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const researchInterestsArray = formData.research_interests_str
      ? formData.research_interests_str.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      designation: formData.designation.trim(),
      qualification: formData.qualification.trim(),
      specialization: formData.specialization.trim(),
      experience: formData.experience.trim(),
      gender: formData.gender,
      photo_url: photoPreview || formData.photo_url || null,
      cover_url: coverPreview || formData.cover_url || null,
      linkedin_url: formData.linkedin_url.trim(),
      linkedin_connections: formData.linkedin_connections.trim(),
      research_interests: researchInterestsArray,
      role: 'FACULTY',
      emp_id: profile?.emp_id,
    };

    try {
      const res = await fetch(`http://localhost:8081/api/v1/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
          'x-tenant': slug,
          'x-user-role': 'FACULTY',
          'x-user-id': profile?.emp_id || '',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        showToast('success', '✨ Profile details & photos permanently saved to PostgreSQL!');
        setIsEditModalOpen(false);

        // Update active profile state
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            name: payload.name,
            phone: payload.phone,
            designation: payload.designation,
            qualification: payload.qualification,
            specialization: payload.specialization,
            experience: payload.experience,
            gender: payload.gender,
            photo_url: payload.photo_url || prev.photo_url,
            cover_url: payload.cover_url || prev.cover_url,
            linkedin_url: payload.linkedin_url,
            linkedin_connections: payload.linkedin_connections,
            research_interests: researchInterestsArray,
          };
        });

        // Update cached user in localStorage
        try {
          const cachedStr = localStorage.getItem('user');
          if (cachedStr) {
            const cachedObj = JSON.parse(cachedStr);
            cachedObj.name = payload.name;
            cachedObj.photo_url = payload.photo_url;
            cachedObj.photoUrl = payload.photo_url;
            localStorage.setItem('user', JSON.stringify(cachedObj));
          }
        } catch {}

        fetchProfile();
      } else {
        showToast('error', json.message || 'Failed to save profile changes');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error while updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Faculty Profile &amp; Mentorship Ledger — MedERP" />
        
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
            }`}
          >
            <span className="text-lg">{toast.type === 'success' ? '✨' : '⚠️'}</span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

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

                  {/* Top Floating Actions: College Badge & Edit Profile Button */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
                      <Building2 className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{profile?.college_name || 'SRMS CET, Bareilly'}</span>
                    </div>

                    <button
                      onClick={handleOpenEditModal}
                      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md hover:bg-white text-[#5B4BFF] dark:text-indigo-400 font-extrabold px-3.5 py-1.5 rounded-full border border-white/40 shadow-lg text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Edit Profile Details & Photo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                {/* Profile Card Body & Stats Header */}
                <div className="p-6 pt-0 relative">
                  <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 mb-2">
                    
                    {/* Left: Avatar & Primary Faculty Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                      <div className="relative group shrink-0 -mt-14 sm:-mt-16">
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
                        <button
                          onClick={handleOpenEditModal}
                          className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#5B4BFF] hover:bg-[#4838DF] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 transition-all hover:scale-110 cursor-pointer"
                          title="Change Profile Photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 pb-1 pt-2 sm:pt-4">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-2xl sm:text-3xl font-black text-[#11141A] dark:text-white tracking-tight">
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
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Academic &amp; Professional Details</span>
                    </h3>
                    <button
                      onClick={handleOpenEditModal}
                      className="text-[11px] font-bold text-[#5B4BFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

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
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>Contact &amp; Campus Information</span>
                    </h3>
                    <button
                      onClick={handleOpenEditModal}
                      className="text-[11px] font-bold text-[#5B4BFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

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
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F36C21]" />
                      <span>Research Interests &amp; Mentorship Domains</span>
                    </h3>
                    <button
                      onClick={handleOpenEditModal}
                      className="text-[11px] font-bold text-[#F36C21] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 dark:bg-indigo-950 text-[#5B4BFF] dark:text-indigo-400 flex items-center justify-center font-black">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white">
                    Edit Faculty Profile &amp; Mentorship Ledger
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400">
                    Updates will permanently synchronize to PostgreSQL database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* Photo Upload & Preview Section */}
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/50 border border-[#E7EAF3] dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-black text-xl flex items-center justify-center border-2 border-white dark:border-slate-700">
                      {formData.name ? formData.name.slice(0, 2).toUpperCase() : 'FAC'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs font-bold text-[#1B1E28] dark:text-white">Profile Photo</p>
                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                    Upload PNG, JPG, or WebP (max 3MB). This photo is visible across MedERP and student directories.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Photo</span>
                    </button>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. Dr. Shorab Ahmad"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                {/* Academic Designation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Academic Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. Associate Professor & Mentor"
                  />
                </div>

                {/* Highest Qualification */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. Ph.D., M.Tech (CSE)"
                  />
                </div>

                {/* Specialization / Domain */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Specialization / Domain
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. Software Engineering & AI Systems"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    Teaching &amp; Industry Experience
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. 12 Years Teaching & Research"
                  />
                </div>

                {/* LinkedIn Profile URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="https://www.linkedin.com/in/username"
                  />
                </div>

                {/* LinkedIn Connections Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200">
                    LinkedIn Connections Display
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin_connections}
                    onChange={(e) => setFormData({ ...formData, linkedin_connections: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                    placeholder="e.g. 1,420"
                  />
                </div>

              </div>

              {/* Research Interests (Comma separated) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
                  <span>Research Interests &amp; Mentorship Domains (comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.research_interests_str}
                  onChange={(e) => setFormData({ ...formData, research_interests_str: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-medium rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] text-slate-800 dark:text-white"
                  placeholder="Machine Learning, Cloud Computing, Distributed Microservices"
                />
                <p className="text-[10px] text-slate-400">Separate domains with commas (e.g. AI Systems, Embedded IoT, Data Structures)</p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-[#5B4BFF]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
