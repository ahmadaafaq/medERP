'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTheoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin/reports/theory-result');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Redirecting to Theory Results...</span>
      </div>
    </div>
  );
}
