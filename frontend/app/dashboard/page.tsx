'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const role = (localStorage.getItem('role') || localStorage.getItem('user_role') || '').toLowerCase().trim();
    if (role.includes('hod')) {
      router.replace('/dashboard/hod');
    } else if (role.includes('dqac')) {
      router.replace('/dashboard/dqac');
    } else if (role.includes('clerk')) {
      router.replace('/dashboard/clerk');
    } else if (role.includes('faculty') || role.includes('teacher') || role.includes('professor')) {
      router.replace('/dashboard/faculty');
    } else if (role.includes('student')) {
      router.replace('/dashboard/student');
    } else if (role.includes('warden')) {
      router.replace('/dashboard/warden');
    } else if (role.includes('admin') || role.includes('principal')) {
      router.replace('/dashboard/admin');
    } else if (role.includes('owner') || role.includes('superadmin')) {
      router.replace('/dashboard/superadmin/firms');
    } else {
      router.replace('/dashboard/faculty');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-white">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Redirecting to your dashboard...</span>
      </div>
    </div>
  );
}

