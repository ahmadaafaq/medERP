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
  MapPin
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
  // Dynamic header stats
  repository_count?: number;
  attendance_percentage?: string | number;
  followers_count?: number;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
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

        const courseStr = meData.courseName || p.course_name || (p.course_cd === '13' ? 'BCA' : p.course_cd === '1' ? 'B.Tech' : p.course_cd || 'Engineering Program');
        const deptStr = meData.departmentName || p.department_name || (p.course_cd === '13' ? 'BCA General' : 'Computer Science & Engineering');

        setProfile({
          id: p.id || meData.id || '',
          name: p.name || meData.name || meData.student_name || 'Tanish Pandey',
          registration_no: p.registration_no || meData.registrationNo || '2025107715',
          rollno: p.rollno || meData.rollno || '2500141790053',
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
          repository_count: p.repository_count || meData.repositoryCount || 14,
          attendance_percentage: p.attendance_percentage || meData.attendancePct || '88.5%',
          followers_count: p.followers_count || meData.followersCount || 142,
        });
      } else {
        loadFallbackFromStorage();
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
      loadFallbackFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackFromStorage = () => {
    const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let cached: any = null;
    try { cached = cachedUserStr ? JSON.parse(cachedUserStr) : null; } catch {}
    let cp = cached?.profile || cached || {};

    setProfile({
      id: cp.id || '1',
      name: cp.name || cached?.name || 'Tanish Pandey',
      registration_no: cp.registration_no || cached?.registrationNo || '2025107715',
      rollno: cp.rollno || cached?.rollno || '2500141790053',
      photo_url: cp.photo_url || cached?.photoUrl || '',
      cover_url: '/campus-cover.png',
      course_name: cp.course_name || cached?.courseName || 'BCA',
      course_cd: cp.course_cd || '13',
      department_name: cp.department_name || cached?.departmentName || 'BCA General',
      batch_cd: cp.batch_cd || 'Batch 2025',
      admission_year: cp.admission_year || '2025',
      email: cached?.email || 'devidattpandey62@gmail.com',
      phone: cp.phone || '8979900657',
      father_name: cp.father_name || 'N/A',
      mother_name: cp.mother_name || 'N/A',
      residency_type: 'Day Scholar',
      academic_session: '2025-2026',
      admission_status: 'ACTIVE',
      college_name: 'SRMS College of Engineering & Technology, Bareilly',
      repository_count: 14,
      attendance_percentage: '88.5%',
      followers_count: 142,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Student Profile — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading Student Profile...
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
                      // Fallback if image fails to load
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-[#2D2575]/20 mix-blend-multiply" />

                  {/* Cover Photo Floating Badge */}
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
                    
                    {/* Left: Avatar & Primary Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                      <div className="relative group shrink-0">
                        {profile?.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.name || 'Student'}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-slate-900 bg-white"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] flex items-center justify-center text-3xl font-black text-white shadow-2xl ring-4 ring-white dark:ring-slate-900">
                            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S'}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00C48C] ring-2 ring-white dark:ring-slate-900" title="Enrolled & Active" />
                      </div>

                      <div className="space-y-1.5 pb-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
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

                    {/* Right: 3 Key Metrics Cards (1. Repository, 2. Attendance, 3. Followers) */}
                    <div className="w-full lg:w-auto bg-[#F6F8FC] dark:bg-slate-800/70 border border-[#E7EAF3] dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-around sm:justify-start gap-4 sm:gap-6 mt-2 lg:mt-0">
                      
                      {/* 1. Repository */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#5B4BFF] mb-1">
                          <FolderGit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.repository_count ?? 14}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                          Repository
                        </span>
                      </div>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 2. Attendance */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#00C48C] mb-1">
                          <CalendarCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.attendance_percentage ?? '88.5%'}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                          Attendance
                        </span>
                      </div>

                      <div className="w-[1px] h-9 bg-[#E7EAF3] dark:bg-slate-700" />

                      {/* 3. Followers */}
                      <div className="text-center px-2 sm:px-3 group cursor-default">
                        <div className="flex items-center justify-center gap-1.5 text-[#F36C21] mb-1">
                          <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                            {profile?.followers_count ?? 142}
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

