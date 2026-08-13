'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface FacultyMember {
  id: string;
  name: string;
  emp_id: string;
  designation: string;
  specialization: string;
  department_name: string;
  email: string;
  phone: string;
  experience: string;
}

export default function DepartmentFacultyPage() {
  const [colleagues, setColleagues] = useState<FacultyMember[]>([]);
  const [deptName, setDeptName] = useState<string>('Department');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentFaculty();
  }, []);

  const fetchDepartmentFaculty = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      // 1. Fetch current logged-in faculty department name
      const meRes = await fetch(`http://localhost:3001/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      let deptId = '';
      let userDeptName = 'Department';

      if (meRes.ok) {
        const meJson = await meRes.json();
        const meData = meJson.data || meJson;
        const profile = meData.profile || {};
        deptId = profile.department_id || meData.departmentId || '';
        userDeptName = profile.department_name || meData.departmentName || 'Department of Physiology';
        setDeptName(userDeptName);
      }

      // 2. Query faculty members filtered by departmentId
      let url = `http://localhost:3001/api/v1/users/faculty?tenant=${slug}`;
      if (deptId) {
        url += `&departmentId=${deptId}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : [];
        
        // Filter to display colleagues belonging to the same department
        const filtered = list.filter((f: any) => {
          if (!deptId) return true;
          return f.department_id === deptId || (f.department_name && f.department_name.includes(userDeptName.replace('Department of ', '')));
        });

        if (filtered.length > 0) {
          setColleagues(filtered);
        } else {
          setColleagues([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch department faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Department Faculty Directory — MedERP" />
        <main className="p-6 space-y-6 flex-1">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-[#F36C21] uppercase tracking-widest">Department Roster</span>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white mt-1">{deptName} Faculty Members</h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1 font-medium">List of professors, associate professors, and teaching staff registered in your department</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-[#EEECFF] text-[#5B4BFF] border border-[#5B4BFF]/30">
              {colleagues.length} {colleagues.length === 1 ? 'Faculty' : 'Faculty Members'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse text-xs font-bold">
                Loading Department Faculty...
              </div>
            ) : colleagues.map((fac) => (
              <div key={fac.id} className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 space-y-4 shadow-soft hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-xl font-black text-white shadow-md shrink-0">
                    {fac.name.charAt(0)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-[#1B1E28] dark:text-white truncate">{fac.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                        {fac.emp_id}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#4E5969] dark:text-slate-300">{fac.designation}</p>
                    <p className="text-[11px] text-[#5B4BFF] font-black">{fac.specialization}</p>
                  </div>
                </div>

                <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                    <span>Email Address</span>
                    <span className="text-[#1B1E28] dark:text-slate-200 font-mono font-bold">{fac.email}</span>
                  </div>
                  <div className="flex justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                    <span>Contact Phone</span>
                    <span className="text-[#1B1E28] dark:text-slate-200 font-mono font-bold">{fac.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex justify-between text-[#4E5969] dark:text-slate-400 font-medium">
                    <span>Experience</span>
                    <span className="text-[#00C48C] font-mono font-bold">{fac.experience || '10+ Years'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
