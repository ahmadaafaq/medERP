'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNoticesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin/notices/sent');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC] dark:bg-slate-950">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-[#4E5969]">Redirecting to Notices Manager...</p>
      </div>
    </div>
  );
}
