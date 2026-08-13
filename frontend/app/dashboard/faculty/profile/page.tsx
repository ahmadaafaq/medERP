'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface FacultyProfile {
  id?: string;
  name?: string;
  emp_id?: string;
  photo_url?: string;
  designation?: string;
  specialization?: string;
  department_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  qualification?: string;
  experience?: string;
  joining_date?: string;
}

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms';
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
        const emp_id = p.emp_id || p.empId || meData.empId || 'DR/07/026';
        const photo_url = p.photo_url || p.photoUrl || meData.photo_url || meData.photoUrl || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : name.includes('Aparna') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png');
        const designation = p.designation || meData.designation || 'Assistant Professor';
        const specialization = p.specialization || meData.specialization || 'Human Physiology';
        const department_name = p.department_name || meData.departmentName || 'Department of Physiology';
        const email = meData.email || p.email || 'sanjay.singh@srms.edu';

        setProfile({
          id: p.id || meData.id || '1',
          name,
          emp_id,
          photo_url,
          designation,
          specialization,
          department_name,
          email,
          phone: p.phone || meData.phone || '+91 98765 43210',
          gender: p.gender || meData.gender || (name.includes('Sarah') || name.includes('Aparna') ? 'Female' : 'Male'),
          qualification: p.qualification || meData.qualification || 'MD (Physiology), MBBS',
          experience: p.experience || meData.experience || '8 Years',
          joining_date: p.joining_date || meData.joining_date || '2018-07-15',
        });
      } else {
        const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        let cached: any = null;
        try { cached = cachedUserStr ? JSON.parse(cachedUserStr) : null; } catch {}
        let cp = cached?.profile || cached || {};
        const name = cp.name || cached?.name || 'Dr. Sanjay Singh';
        setProfile({
          id: cp.id || '1',
          name,
          emp_id: cp.emp_id || cp.empId || cached?.empId || 'DR/07/026',
          photo_url: cp.photo_url || cp.photoUrl || cached?.photo_url || (name.includes('Sarah') ? '/avatars/dr_sarah_sharma.png' : '/avatars/dr_sanjay_singh.png'),
          designation: cp.designation || cached?.designation || 'Assistant Professor',
          specialization: cp.specialization || cached?.specialization || 'Human Physiology',
          department_name: cp.department_name || cached?.departmentName || 'Department of Physiology',
          email: cached?.email || cp.email || 'sanjay.singh@srms.edu',
          phone: cp.phone || '+91 98765 43210',
          gender: cp.gender || 'Male',
          qualification: cp.qualification || 'MD (Physiology), MBBS',
          experience: cp.experience || '8 Years',
          joining_date: cp.joining_date || '2018-07-15',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile({
        id: '1',
        name: 'Dr. Sanjay Singh',
        emp_id: 'DR/07/026',
        photo_url: '/avatars/dr_sanjay_singh.png',
        designation: 'Assistant Professor',
        specialization: 'Human Physiology',
        department_name: 'Department of Physiology',
        email: 'sanjay.singh@srms.edu',
        phone: '+91 98765 43210',
        gender: 'Male',
        qualification: 'MD (Physiology), MBBS',
        experience: '8 Years',
        joining_date: '2018-07-15',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Profile — MedERP" />
        <main className="p-6 space-y-6 flex-1 max-w-5xl">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading Faculty Profile...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name || 'Faculty'}
                    className="w-24 h-24 rounded-full object-cover shadow-xl ring-4 ring-[#5B4BFF]/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ring-[#5B4BFF]/20">
                    {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'F'}
                  </div>
                )}
                <div className="space-y-1 text-center md:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h2 className="text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">{profile?.name}</h2>
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                      {profile?.emp_id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#4E5969] dark:text-slate-300">{profile?.designation}</p>
                  <p className="text-xs text-[#5B4BFF] font-black">{profile?.department_name}</p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
                    Academic &amp; Professional Details
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Employee ID</span>
                      <span className="font-mono font-black text-[#1B1E28] dark:text-slate-200">{profile?.emp_id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Designation</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.designation}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Specialization</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.specialization}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Qualification</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.qualification}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Teaching Experience</span>
                      <span className="font-mono font-bold text-[#00C48C]">{profile?.experience}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                  <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
                    Contact &amp; Department Information
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Department</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.department_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Email Address</span>
                      <span className="font-mono font-bold text-[#5B4BFF]">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Phone Number</span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Gender</span>
                      <span className="font-bold text-[#1B1E28] dark:text-slate-200">{profile?.gender}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E7EAF3] dark:border-slate-800/50">
                      <span className="text-[#4E5969] dark:text-slate-400 font-medium">Date of Joining</span>
                      <span className="font-mono font-bold text-[#1B1E28] dark:text-slate-200">{profile?.joining_date}</span>
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
